
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiArrowLeft,
  FiSave,
  FiFileText,
  FiCamera,
  FiGrid,
  FiHash,
  FiImage,
  FiEdit3,
  FiMenu,
} from "react-icons/fi";
import { supabase } from "../lib/supabase";
import DashboardSidebar from "../components/dashboard/DashboardSidebar";

const BARCODE_FORMATS = [
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.UPC_A,
  Html5QrcodeSupportedFormats.UPC_E,
  Html5QrcodeSupportedFormats.CODE_39,
  Html5QrcodeSupportedFormats.CODE_93,
  Html5QrcodeSupportedFormats.CODE_128,
  Html5QrcodeSupportedFormats.ITF,
];

function AddAsset() {
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [formData, setFormData] = useState({
    product_name: "",
    brand: "",
    category: "",
    model: "",
    serial_number: "",
    invoice_number: "",
    purchase_date: "",
    warranty_months: "",
    warranty_expiry: "",
    store_name: "",
    purchase_price: "",
    location_in_home: "",
    notes: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);
  const [activeMethod, setActiveMethod] = useState("manual");
  const [productPhoto, setProductPhoto] = useState(null);
  const [invoiceDocument, setInvoiceDocument] = useState(null);
  const [extracting, setExtracting] = useState(false);
  const [extractionMessage, setExtractionMessage] = useState("");
  const [qrResult, setQrResult] = useState("");
  const [qrError, setQrError] = useState("");
  const [scanningQR, setScanningQR] = useState(false);
  const [barcodeResult, setBarcodeResult] = useState(null);
  const [barcodeError, setBarcodeError] = useState("");
  const [scanningBarcode, setScanningBarcode] = useState(false);
  const [readingBarcodeImage, setReadingBarcodeImage] = useState(false);
  const [lookingUpBarcode, setLookingUpBarcode] = useState(false);
  const [scannedBill, setScannedBill] = useState(null);

  const qrScannerRef = useRef(null);
  const barcodeScannerRef = useRef(null);

  useEffect(() => {
    return () => {
      const scanners = [
        qrScannerRef.current,
        barcodeScannerRef.current,
      ];

      scanners.forEach((scanner) => {
        if (scanner) {
          try {
            if (scanner.isScanning) {
              scanner.stop().catch((err) =>
                console.error("Scanner cleanup error:", err),
              );
            }
          } catch (err) {
            console.error("Scanner cleanup error:", err);
          }
        }
      });
    };
  }, []);

  const handleWarrantyExtraction = async (file) => {
    if (!file) {
      setExtractionMessage("Please select an image first.");
      return;
    }

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setExtractionMessage("Please choose a JPG, PNG, or WebP image.");
      return;
    }

    setExtracting(true);
    setExtractionMessage("");

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) throw sessionError;
      if (!session) throw new Error("Please log in again.");

      const imageBase64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => {
          if (typeof reader.result !== "string") {
            reject(new Error("Could not read the image."));
            return;
          }

          resolve(reader.result.split(",")[1]);
        };

        reader.onerror = () => reject(new Error("Could not read the image."));
        reader.readAsDataURL(file);
      });

      let data;
      let extractionError;

      for (let attempt = 0; attempt < 3; attempt += 1) {
        const result = await supabase.functions.invoke("rapid-processor", {
          body: {
            imageBase64,
            mimeType: file.type,
            mode: activeMethod === "photo" ? "photo" : "bill",
          },
        });

        data = result.data;
        extractionError = result.error;

        if (!extractionError) break;

        let message = extractionError.message;

        if (extractionError.context) {
          try {
            const response = await extractionError.context.clone().json();
            message = response.details || response.error || message;
          } catch {
            // Use the original error message if response details are unavailable.
          }
        }

        const temporaryError =
          /high demand|overload|rate.?limit|\b429\b|\b503\b/i.test(message);

        if (!temporaryError || attempt === 2) {
          throw new Error(
            `${message}${temporaryError ? " Please try again later." : ""}`,
          );
        }

        setExtractionMessage("AI service is busy. Retrying...");
        await new Promise((resolve) =>
          setTimeout(resolve, 1500 * (attempt + 1)),
        );
      }

      if (extractionError) throw extractionError;

      if (!data?.success || !data?.extracted) {
        throw new Error(data?.error || "Could not extract product details.");
      }

      const extracted = data.extracted;

      setFormData((previous) => {
        const updated = { ...previous };

        const fields = [
          "product_name",
          "brand",
          "category",
          "model",
          "serial_number",
          "invoice_number",
          "purchase_date",
          "warranty_months",
          "warranty_expiry",
          "store_name",
          "purchase_price",
          "notes",
        ];

        fields.forEach((field) => {
          const value = extracted[field];

          if (value !== null && value !== undefined && value !== "") {
            updated[field] = String(value);
          }
        });

        return updated;
      });

      setExtractionMessage(
        "Details extracted! Review them before saving.",
      );
    } catch (err) {
      console.error("AI extraction error:", err);
      setExtractionMessage(err.message || "Could not analyze the image.");
    } finally {
      setExtracting(false);
    }
  };

  const getBarcodeCategory = (product) => {
    const details = [
      product.product_name,
      product.categories,
      ...(product.categories_tags || []),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    if (/vehicle|car|motorcycle|bicycle|automotive/.test(details)) {
      return "Vehicles";
    }

    if (
      /washing machine|refrigerator|dishwasher|air conditioner|microwave|household appliance/.test(
        details,
      )
    ) {
      return "Appliances";
    }

    if (
      /electronics|computer|laptop|mobile phone|smartphone|tablet|television|camera|headphone/.test(
        details,
      )
    ) {
      return "Personal electronics";
    }

    if (/business|industrial|office equipment/.test(details)) {
      return "Business assets";
    }

    if (/household|furniture|kitchen|cleaning product|home appliance/.test(details)) {
      return "Home & household products";
    }

    if (/food|beverage|snack|noodle|cereal/.test(details)) {
      return "Other";
    }

    return "";
  };

  const getCatalogBarcode = (barcode) => {
    const value = barcode.trim();
    const gs1Match = value.match(/^(?:\]C1)?01(\d{14})$/);
    const catalogBarcode = gs1Match?.[1] || value;

    return /^\d+$/.test(catalogBarcode) &&
      [8, 12, 13, 14].includes(catalogBarcode.length)
      ? catalogBarcode
      : null;
  };

  const lookupBarcodeProduct = async (barcode, format) => {
    const catalogBarcode = getCatalogBarcode(barcode);

    if (!catalogBarcode) {
      setBarcodeError(
        `Scanned ${format}, but this is not a standard 8, 12, 13, or 14 digit product code.`,
      );
      return;
    }

    setLookingUpBarcode(true);
    setBarcodeError("");

    try {
      const productUrl = new URL(
        `https://world.openfoodfacts.org/api/v3/product/${encodeURIComponent(catalogBarcode)}`,
      );

      productUrl.searchParams.set("product_type", "all");
      productUrl.searchParams.set(
        "fields",
        "product_name,product_name_en,brands,categories,categories_tags",
      );

      const response = await fetch(productUrl);

      if (response.status === 404) {
        setBarcodeError(
          "Product not found in the catalog. Enter details manually.",
        );
        return;
      }

      if (!response.ok) {
        throw new Error("Product catalog is temporarily unavailable.");
      }

      const result = await response.json();
      const product = result.product;

      const productName =
        product?.product_name?.trim() ||
        product?.product_name_en?.trim() ||
        "";

      const brand = product?.brands?.split(",")[0]?.trim() || "";
      const category = product ? getBarcodeCategory(product) : "";

      if (!productName && !brand && !category) {
        setBarcodeError(
          "No product details found. Please enter details manually.",
        );
        return;
      }

      setFormData((previous) => ({
        ...previous,
        ...(productName && !previous.product_name.trim()
          ? { product_name: productName }
          : {}),
        ...(brand && !previous.brand.trim() ? { brand } : {}),
        ...(category && !previous.category ? { category } : {}),
      }));

      setBarcodeResult((previous) => ({
        ...previous,
        productName,
        brand,
      }));
    } catch (err) {
      console.error("Barcode lookup error:", err);
      setBarcodeError(
        err.message || "Could not look up product. Enter details manually.",
      );
    } finally {
      setLookingUpBarcode(false);
    }
  };

  const handleDetectedBarcode = async (barcode, format) => {
    setBarcodeResult({ value: barcode.trim(), format });
    await lookupBarcodeProduct(barcode.trim(), format);
  };

  const scanBarcodeImage = async (file) => {
    if (!file) return;

    setBarcodeError("");
    setBarcodeResult(null);
    setReadingBarcodeImage(true);

    let scanner;

    try {
      scanner = new Html5Qrcode("barcode-reader", {
        formatsToSupport: BARCODE_FORMATS,
        useBarCodeDetectorIfSupported: true,
      });

      const result = await scanner.scanFileV2(file, false);
      const format =
        result.result.format?.formatName?.replaceAll("_", "-") || "Barcode";

      await handleDetectedBarcode(result.decodedText, format);
    } catch (err) {
      console.error("Barcode image scan error:", err);
      setBarcodeError(
        "No supported barcode found. Try a clearer photo or use the camera scanner.",
      );
    } finally {
      try {
        scanner?.clear();
      } catch {
        // Ignore scanner cleanup errors.
      }

      setReadingBarcodeImage(false);
    }
  };

  const startBarcodeScanner = async () => {
    setBarcodeError("");
    setBarcodeResult(null);

    let scanner;
    let decoded = false;

    try {
      scanner = new Html5Qrcode("barcode-reader", {
        formatsToSupport: BARCODE_FORMATS,
        useBarCodeDetectorIfSupported: true,
      });

      barcodeScannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: (width, height) => ({
            width: Math.floor(width * 0.9),
            height: Math.min(160, Math.max(60, Math.floor(height * 0.35))),
          }),
        },
        async (decodedText, result) => {
          if (decoded) return;
          decoded = true;

          setScanningBarcode(false);

          try {
            await scanner.stop();
            scanner.clear();
          } catch (err) {
            console.error("Barcode scanner stop error:", err);
          }

          barcodeScannerRef.current = null;

          const format =
            result.result.format?.formatName?.replaceAll("_", "-") ||
            "Barcode";

          await handleDetectedBarcode(decodedText, format);
        },
        () => {},
      );

      setScanningBarcode(true);
    } catch (err) {
      console.error("Barcode camera error:", err);
      setBarcodeError(
        "Could not start the camera. Allow camera access and try again.",
      );

      setScanningBarcode(false);

      try {
        if (scanner?.isScanning) await scanner.stop();
        scanner?.clear();
      } catch {
        // Ignore cleanup errors.
      }

      barcodeScannerRef.current = null;
    }
  };

  const stopBarcodeScanner = async () => {
    const scanner = barcodeScannerRef.current;

    try {
      if (scanner?.isScanning) await scanner.stop();
      scanner?.clear();
    } catch (err) {
      console.error("Could not stop barcode scanner:", err);
    } finally {
      barcodeScannerRef.current = null;
      setScanningBarcode(false);
    }
  };

  const startQRScanner = async () => {
    setQrResult("");
    setQrError("");

    let scanner;

    try {
      scanner = new Html5Qrcode("qr-reader");
      qrScannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText) => {
          setQrResult(decodedText);
          setScanningQR(false);

          try {
            await scanner.stop();
            scanner.clear();
          } catch (err) {
            console.error("QR scanner stop error:", err);
          }

          qrScannerRef.current = null;

          try {
            const product = JSON.parse(decodedText);

            if (!product || typeof product !== "object" || Array.isArray(product)) {
              throw new Error("Unsupported QR data");
            }

            setFormData((previous) => ({
              ...previous,
              product_name:
                product.product_name ||
                product.productName ||
                previous.product_name,
              brand: product.brand || previous.brand,
              model: product.model || previous.model,
              serial_number:
                product.serial_number ||
                product.serialNumber ||
                previous.serial_number,
              invoice_number:
                product.invoice_number ||
                product.invoiceNumber ||
                previous.invoice_number,
              purchase_date:
                product.purchase_date ||
                product.purchaseDate ||
                previous.purchase_date,
              warranty_months: String(
                product.warranty_months ??
                  product.warrantyMonths ??
                  previous.warranty_months,
              ),
              warranty_expiry:
                product.warranty_expiry ||
                product.warrantyExpiry ||
                previous.warranty_expiry,
            }));

            setQrError("Product details were read from the QR code.");
          } catch {
            setFormData((previous) => ({
              ...previous,
              serial_number: previous.serial_number || decodedText.trim(),
            }));

            setQrError(
              "QR code scanned. Enter any remaining product details manually.",
            );
          }
        },
        () => {},
      );

      setScanningQR(true);
    } catch (err) {
      console.error("QR scanner error:", err);
      setQrError("Could not start the camera. Allow camera access and retry.");
      setScanningQR(false);

      try {
        if (scanner?.isScanning) await scanner.stop();
        scanner?.clear();
      } catch {
        // Ignore cleanup errors.
      }

      qrScannerRef.current = null;
    }
  };

  const stopQRScanner = async () => {
    const scanner = qrScannerRef.current;

    try {
      if (scanner?.isScanning) await scanner.stop();
      scanner?.clear();
    } catch (err) {
      console.error("Could not stop QR scanner:", err);
    } finally {
      qrScannerRef.current = null;
      setScanningQR(false);
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const calculateExpiry = (purchaseDate, months) => {
    if (!purchaseDate || months === "" || Number(months) < 0) return "";

    const date = new Date(`${purchaseDate}T12:00:00`);
    date.setMonth(date.getMonth() + Number(months));

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  const handleWarrantyChange = (event) => {
    const months = event.target.value;

    setFormData((previous) => ({
      ...previous,
      warranty_months: months,
      warranty_expiry: calculateExpiry(previous.purchase_date, months),
    }));
  };

  const handlePurchaseDateChange = (event) => {
    const purchaseDate = event.target.value;

    setFormData((previous) => ({
      ...previous,
      purchase_date: purchaseDate,
      warranty_expiry: calculateExpiry(
        purchaseDate,
        previous.warranty_months,
      ),
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.product_name.trim()) {
      setError("Please enter the product name.");
      return;
    }

    setSaving(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;
      if (!user) throw new Error("You must be logged in to add an asset.");

      const { data: asset, error: insertError } = await supabase
        .from("assets")
        .insert([
          {
            user_id: user.id,
            product_name: formData.product_name.trim(),
            brand: formData.brand.trim() || null,
            category: formData.category || null,
            model: formData.model.trim() || null,
            serial_number: formData.serial_number.trim() || null,
            invoice_number: formData.invoice_number.trim() || null,
            purchase_date: formData.purchase_date || null,
            warranty_months: formData.warranty_months
              ? Number(formData.warranty_months)
              : null,
            warranty_expiry: formData.warranty_expiry || null,
            store_name: formData.store_name.trim() || null,
            purchase_price: formData.purchase_price
              ? Number(formData.purchase_price)
              : null,
            location_in_home: formData.location_in_home.trim() || null,
            notes: formData.notes.trim() || null,
          },
        ])
        .select("id")
        .single();

      if (insertError) throw insertError;

      let productPhotoPath = null;
      let invoiceFilePath = null;

      if (productPhoto) {
        const extension = productPhoto.name.split(".").pop();
        productPhotoPath = `${user.id}/${asset.id}.${extension}`;

        const { error: uploadError } = await supabase.storage
          .from("asset-photos")
          .upload(productPhotoPath, productPhoto, {
            contentType: productPhoto.type,
          });

        if (uploadError) throw uploadError;
      }

      if (invoiceDocument) {
        const extension = invoiceDocument.name.split(".").pop();
        invoiceFilePath = `${user.id}/${asset.id}-invoice.${extension}`;

        const { error: uploadError } = await supabase.storage
          .from("asset-documents")
          .upload(invoiceFilePath, invoiceDocument, {
            contentType: invoiceDocument.type,
          });

        if (uploadError) throw uploadError;
      }

      if (productPhotoPath || invoiceFilePath) {
        const { error: updateError } = await supabase
          .from("assets")
          .update({
            ...(productPhotoPath
              ? { product_photo_path: productPhotoPath }
              : {}),
            ...(invoiceFilePath
              ? { invoice_file_path: invoiceFilePath }
              : {}),
          })
          .eq("id", asset.id)
          .eq("user_id", user.id);

        if (updateError) throw updateError;
      }

      setSuccess("Product added successfully!");

      setTimeout(() => {
        navigate("/dashboard");
      }, 1000);
    } catch (err) {
      console.error("Add asset error:", err);
      setError(err.message || "Something went wrong while saving the product.");
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";

  const methodClass = (method) =>
    `flex items-center gap-4 rounded-2xl border p-5 text-left transition ${
      activeMethod === method
        ? "border-blue-300 bg-blue-50/50 shadow-sm"
        : "border-slate-200 bg-white hover:border-blue-200 hover:shadow-sm"
    }`;

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="min-h-screen lg:ml-72">
        {/* Header */}
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                aria-label="Open navigation"
                className="rounded-lg border border-slate-200 p-2 text-slate-700 hover:bg-slate-100 lg:hidden"
              >
                <FiMenu size={20} />
              </button>

              <Link
                to="/dashboard"
                className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-blue-600"
              >
                <FiArrowLeft size={17} />
                <span className="hidden sm:inline">Back to Dashboard</span>
                <span className="sm:hidden">Back</span>
              </Link>
            </div>

            <div className="text-lg font-bold tracking-tight text-slate-900">
              AssetCare-AI
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <p className="text-sm font-semibold text-blue-600">
              Asset management
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Add a product
            </h1>
            <p className="mt-2 text-sm text-slate-500 sm:text-base">
              Add your product manually, scan a barcode, or extract details
              from an image.
            </p>
          </motion.div>

          {/* Entry methods */}
          <motion.section
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3"
          >
            {[
              {
                id: "upload",
                title: "Upload Bill",
                description: "Upload an invoice or warranty image",
                icon: FiFileText,
              },
              {
                id: "scan",
                title: "Scan Bill",
                description: "Use the camera to capture a bill",
                icon: FiCamera,
              },
              {
                id: "manual",
                title: "Manual Entry",
                description: "Enter product details yourself",
                icon: FiEdit3,
              },
              {
                id: "qr",
                title: "Scan QR Code",
                description: "Read a product QR code",
                icon: FiGrid,
              },
              {
                id: "barcode",
                title: "Scan Barcode",
                description: "Read an EAN or UPC barcode",
                icon: FiHash,
              },
              {
                id: "photo",
                title: "Product Photo",
                description: "Upload a photo for AI extraction",
                icon: FiImage,
              },
            ].map(({ id, title, description, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setActiveMethod(id);
                  setExtractionMessage("");
                  setError("");
                  setQrError("");
                  setBarcodeError("");
                }}
                className={methodClass(id)}
              >
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
                  <Icon size={24} />
                </div>
                <div>
                  <h2 className="font-bold text-slate-900">{title}</h2>
                  <p className="mt-1 text-sm text-slate-500">{description}</p>
                </div>
              </button>
            ))}
          </motion.section>

          {/* Bill scan */}
          {activeMethod === "scan" && (
            <section className="mb-6 rounded-2xl border border-blue-200 bg-blue-50 p-5">
              <h3 className="font-semibold text-blue-800">Scan Purchase Bill</h3>
              <p className="mt-1 text-sm text-blue-700">
                Take a clear photo of your bill to extract product details.
              </p>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(event) => {
                  setScannedBill(event.target.files?.[0] || null);
                  setExtractionMessage("");
                }}
                className="mt-4 block w-full text-sm"
              />
              {scannedBill && (
                <>
                  <p className="mt-2 text-sm text-slate-600">
                    Selected: {scannedBill.name}
                  </p>
                  <button
                    type="button"
                    onClick={() => handleWarrantyExtraction(scannedBill)}
                    disabled={extracting}
                    className="mt-3 rounded-xl bg-blue-600 px-5 py-3 font-medium text-white disabled:opacity-50"
                  >
                    {extracting ? "Analyzing bill..." : "Extract Bill Details"}
                  </button>
                </>
              )}
              {extractionMessage && (
                <p className="mt-3 text-sm text-slate-700">{extractionMessage}</p>
              )}
            </section>
          )}

          {/* QR scanner */}
          {activeMethod === "qr" && (
            <section className="mb-6 rounded-2xl border border-blue-200 bg-blue-50 p-5">
              <h3 className="font-semibold text-blue-800">Scan QR Code</h3>
              <div id="qr-reader" className="mt-4 w-full max-w-md" />
              {!scanningQR ? (
                <button
                  type="button"
                  onClick={startQRScanner}
                  className="mt-4 rounded-xl bg-blue-600 px-5 py-3 font-medium text-white"
                >
                  Start QR Scanner
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopQRScanner}
                  className="mt-4 rounded-xl border bg-white px-5 py-3 font-medium text-slate-700"
                >
                  Stop Camera
                </button>
              )}
              {qrResult && (
                <p className="mt-3 break-all text-sm text-green-700">
                  Scanned: {qrResult}
                </p>
              )}
              {qrError && (
                <p className="mt-3 text-sm text-slate-700">{qrError}</p>
              )}
            </section>
          )}

          {/* Barcode scanner */}
          {activeMethod === "barcode" && (
            <section className="mb-6 rounded-2xl border border-blue-200 bg-blue-50 p-5">
              <h3 className="font-semibold text-blue-800">Scan Barcode</h3>
              <p className="mt-1 text-sm text-blue-700">
                Scan a barcode with your camera or upload a clear barcode image.
              </p>
              <div id="barcode-reader" className="mt-4 w-full max-w-md overflow-hidden rounded-xl" />

              {scanningBarcode ? (
                <button
                  type="button"
                  onClick={stopBarcodeScanner}
                  className="mt-4 rounded-xl border bg-white px-5 py-3 font-medium text-slate-700"
                >
                  Stop Camera
                </button>
              ) : (
                <button
                  type="button"
                  onClick={startBarcodeScanner}
                  className="mt-4 rounded-xl bg-blue-600 px-5 py-3 font-medium text-white"
                >
                  Start Barcode Scanner
                </button>
              )}

              <label className="mt-4 block text-sm font-medium text-slate-700">
                Scan from photo
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  disabled={scanningBarcode || readingBarcodeImage || lookingUpBarcode}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    event.target.value = "";
                    scanBarcodeImage(file);
                  }}
                  className="mt-2 block w-full text-sm"
                />
              </label>

              {(readingBarcodeImage || lookingUpBarcode) && (
                <p className="mt-3 text-sm text-blue-700">
                  {readingBarcodeImage ? "Reading barcode..." : "Looking up product..."}
                </p>
              )}
              {barcodeResult && (
                <p className="mt-3 break-all text-sm text-green-700">
                  Scanned {barcodeResult.format}: {barcodeResult.value}
                </p>
              )}
              {(barcodeResult?.productName || barcodeResult?.brand) && (
                <p className="mt-2 text-sm text-green-700">
                  Catalog match: {barcodeResult.productName} {barcodeResult.brand}
                </p>
              )}
              {barcodeError && (
                <p className="mt-3 text-sm text-red-600">{barcodeError}</p>
              )}
            </section>
          )}

          {/* Main form */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/40 sm:p-8"
          >
            <div className="mb-7">
              <h2 className="text-lg font-bold text-slate-900">
                Product details
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Review extracted information or enter the details manually.
              </p>
            </div>

            {error && (
              <div role="alert" className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}
            {success && (
              <div role="status" className="mb-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-600">
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="grid gap-x-5 gap-y-5 md:grid-cols-2 xl:grid-cols-3">
                <div className="md:col-span-2 xl:col-span-3">
                  <label htmlFor="product_name" className="mb-2 block text-sm font-medium text-slate-700">
                    Product Name *
                  </label>
                  <input id="product_name" name="product_name" required value={formData.product_name} onChange={handleChange} placeholder="Example: Samsung Washing Machine" className={inputClass} />
                </div>

                <div>
                  <label htmlFor="brand" className="mb-2 block text-sm font-medium text-slate-700">Brand</label>
                  <input id="brand" name="brand" value={formData.brand} onChange={handleChange} placeholder="Brand" className={inputClass} />
                </div>

                <div>
                  <label htmlFor="category" className="mb-2 block text-sm font-medium text-slate-700">Category</label>
                  <select id="category" name="category" value={formData.category} onChange={handleChange} className={inputClass}>
                    <option value="">Select category</option>
                    <option value="Home & household products">Home & household products</option>
                    <option value="Personal electronics">Personal electronics</option>
                    <option value="Vehicles">Vehicles</option>
                    <option value="Appliances">Appliances</option>
                    <option value="Business assets">Business assets</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="model" className="mb-2 block text-sm font-medium text-slate-700">Model</label>
                  <input id="model" name="model" value={formData.model} onChange={handleChange} placeholder="Model" className={inputClass} />
                </div>

                <div>
                  <label htmlFor="serial_number" className="mb-2 block text-sm font-medium text-slate-700">Serial Number</label>
                  <input id="serial_number" name="serial_number" value={formData.serial_number} onChange={handleChange} placeholder="Serial Number" className={inputClass} />
                </div>

                {activeMethod === "photo" && (
                  <div className="md:col-span-2 xl:col-span-3">
                    <label className="mb-2 block text-sm font-medium text-slate-700">Product Photo</label>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(event) => setProductPhoto(event.target.files?.[0] || null)}
                      className={inputClass}
                    />

                    {productPhoto && (
                      <div className="mt-4">
                        <img
                          src={URL.createObjectURL(productPhoto)}
                          alt="Product preview"
                          className="h-48 w-48 rounded-xl border border-slate-200 object-cover"
                        />
                        <button type="button" onClick={() => setProductPhoto(null)} className="mt-2 text-sm text-red-600">
                          Remove photo
                        </button>
                      </div>
                    )}

                    <button type="button" onClick={() => handleWarrantyExtraction(productPhoto)} disabled={extracting || !productPhoto} className="mt-4 rounded-xl bg-indigo-600 px-5 py-3 font-medium text-white disabled:opacity-50">
                      {extracting ? "Analyzing photo..." : "Extract Details with AI"}
                    </button>
                    {extractionMessage && <p className="mt-3 text-sm text-slate-600">{extractionMessage}</p>}
                  </div>
                )}

                {activeMethod === "upload" && (
                  <div className="md:col-span-2 xl:col-span-3">
                    <label className="mb-2 block text-sm font-medium text-slate-700">Invoice / Warranty Document</label>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,.pdf"
                      onChange={(event) => setInvoiceDocument(event.target.files?.[0] || null)}
                      className={inputClass}
                    />
                    <p className="mt-1 text-xs text-slate-500">
                      AI extraction currently supports JPG, PNG and WebP images, not PDF files.
                    </p>
                    <button
                      type="button"
                      onClick={() => handleWarrantyExtraction(invoiceDocument)}
                      disabled={extracting || !invoiceDocument || !["image/jpeg", "image/png", "image/webp"].includes(invoiceDocument.type)}
                      className="mt-3 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-medium text-white disabled:opacity-50"
                    >
                      {extracting ? "Analyzing document..." : "Extract Details with AI"}
                    </button>
                    {extractionMessage && <p className="mt-3 text-sm text-slate-600">{extractionMessage}</p>}
                  </div>
                )}

                <div>
                  <label htmlFor="invoice_number" className="mb-2 block text-sm font-medium text-slate-700">Invoice Number</label>
                  <input id="invoice_number" name="invoice_number" value={formData.invoice_number} onChange={handleChange} placeholder="Invoice Number" className={inputClass} />
                </div>

                <div>
                  <label htmlFor="purchase_date" className="mb-2 block text-sm font-medium text-slate-700">Purchase Date</label>
                  <input id="purchase_date" name="purchase_date" type="date" value={formData.purchase_date} onChange={handlePurchaseDateChange} className={inputClass} />
                </div>

                <div>
                  <label htmlFor="warranty_months" className="mb-2 block text-sm font-medium text-slate-700">Warranty (months)</label>
                  <input id="warranty_months" name="warranty_months" type="number" min="0" value={formData.warranty_months} onChange={handleWarrantyChange} placeholder="Warranty months" className={inputClass} />
                  {formData.warranty_expiry && (
                    <p className="mt-2 text-xs text-slate-500">
                      Warranty expires on {new Date(`${formData.warranty_expiry}T12:00:00`).toLocaleDateString("en-IN")}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="store_name" className="mb-2 block text-sm font-medium text-slate-700">Store</label>
                  <input id="store_name" name="store_name" value={formData.store_name} onChange={handleChange} placeholder="Store name" className={inputClass} />
                </div>

                <div>
                  <label htmlFor="purchase_price" className="mb-2 block text-sm font-medium text-slate-700">Price</label>
                  <input id="purchase_price" name="purchase_price" type="number" min="0" step="0.01" value={formData.purchase_price} onChange={handleChange} placeholder="Price" className={inputClass} />
                </div>

                <div>
                  <label htmlFor="location_in_home" className="mb-2 block text-sm font-medium text-slate-700">Location in Home</label>
                  <input id="location_in_home" name="location_in_home" value={formData.location_in_home} onChange={handleChange} placeholder="Example: Kitchen" className={inputClass} />
                </div>

                <div>
                  <label htmlFor="warranty_expiry" className="mb-2 block text-sm font-medium text-slate-700">Warranty Expiry</label>
                  <input id="warranty_expiry" name="warranty_expiry" type="date" value={formData.warranty_expiry} onChange={handleChange} className={inputClass} />
                </div>

                <div className="md:col-span-2 xl:col-span-3">
                  <label htmlFor="notes" className="mb-2 block text-sm font-medium text-slate-700">Notes</label>
                  <textarea id="notes" name="notes" rows={4} value={formData.notes} onChange={handleChange} placeholder="Add any additional information..." className={`${inputClass} resize-none`} />
                </div>
              </div>

              <div className="mt-8 flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end">
                <button type="button" onClick={() => navigate("/dashboard")} className="rounded-xl px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50">
                  Cancel
                </button>
                <motion.button
                  type="submit"
                  disabled={saving}
                  whileHover={!saving ? { y: -2 } : {}}
                  whileTap={!saving ? { scale: 0.98 } : {}}
                  className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <FiSave size={17} />
                  {saving ? "Saving..." : "Save Product"}
                </motion.button>
              </div>
            </form>
          </motion.section>
        </main>
      </div>
    </div>
  );
}

export default AddAsset;
