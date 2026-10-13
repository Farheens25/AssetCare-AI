import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { useRef, useState } from "react";
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
} from "react-icons/fi";
import { supabase } from "../lib/supabase";

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
  const qrScannerRef = useRef(null);
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

  const handleWarrantyExtraction = async (file) => {
    if (!file) {
      setExtractionMessage("Please select a warranty-card image.");
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

      if (!session) {
        throw new Error("Please log in again.");
      }

      const imageBase64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => {
          const result = reader.result;

          if (typeof result !== "string") {
            reject(new Error("Could not read the image."));
            return;
          }

          resolve(result.split(",")[1]);
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

        let detailedMessage = extractionError.message;

        if (extractionError.context) {
          try {
            const response = await extractionError.context.clone().json();

            console.error("Edge Function response:", response);

            detailedMessage =
              response.details || response.error || extractionError.message;
          } catch (detailsError) {
            console.error("Could not read error response:", detailsError);
          }
        }

        const isTemporaryCapacityError =
          /high demand|overload|rate.?limit|\b429\b|\b503\b/i.test(
            detailedMessage,
          );

        if (!isTemporaryCapacityError || attempt === 2) {
          console.error("AI extraction error:", extractionError);
          setExtractionMessage(
            `AI extraction failed: ${detailedMessage}${
              isTemporaryCapacityError
                ? " Please wait a moment and try again."
                : ""
            }`,
          );
          return;
        }

        setExtractionMessage(
          `AI service is busy. Retrying (${attempt + 1}/2)...`,
        );
        await new Promise((resolve) =>
          setTimeout(resolve, 1500 * (attempt + 1)),
        );
      }

      if (extractionError) {
        throw extractionError;
      }

      if (!data?.success || !data?.extracted) {
        throw new Error(data?.error || "Could not extract warranty details.");
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
        "Details extracted! Please review them before saving.",
      );
    } catch (error) {
      console.error("Warranty extraction error:", error);
      setExtractionMessage(
        error.message || "Could not analyze the warranty card.",
      );
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
    if (
      /household|furniture|kitchen|cleaning product|home appliance/.test(
        details,
      )
    ) {
      return "Home & household products";
    }
    if (/food|beverage|snack|noodle|cereal/.test(details)) {
      return "Other";
    }

    return "";
  };

  const getCatalogBarcode = (barcode) => {
    const gs1Match = barcode.trim().match(/^(?:\]C1)?01(\d{14})$/);
    const catalogBarcode = gs1Match?.[1] || barcode.trim();

    return /^\d+$/.test(catalogBarcode) &&
      [8, 12, 13, 14].includes(catalogBarcode.length)
      ? catalogBarcode
      : null;
  };

  const lookupBarcodeProduct = async (barcode, format) => {
    const catalogBarcode = getCatalogBarcode(barcode);

    if (!catalogBarcode) {
      setBarcodeError(
        `Scanned ${format} successfully, but this ${barcode.length}-character code is not a standard EAN/UPC/GTIN. Product lookup requires an 8, 12, 13, or 14-digit code.`,
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
          "Barcode read, but this product is not listed in the catalog. Enter the details manually.",
        );
        return;
      }
      if (!response.ok) {
        throw new Error("The product catalog is temporarily unavailable.");
      }

      const result = await response.json();
      const product = result.product;
      const productName =
        product?.product_name?.trim() || product?.product_name_en?.trim() || "";
      const brand = product?.brands?.split(",")[0]?.trim() || "";
      const category = product ? getBarcodeCategory(product) : "";

      if (!productName && !brand && !category) {
        setBarcodeError(
          "Barcode read, but no product details were found in the catalog. Enter the details manually.",
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
    } catch (error) {
      console.error("Barcode product lookup error:", error);
      setBarcodeError(
        error instanceof TypeError
          ? "Barcode read, but the catalog could not be reached. Check your connection or enter the details manually."
          : `${error.message} Enter the details manually.`,
      );
    } finally {
      setLookingUpBarcode(false);
    }
  };

  const handleDetectedBarcode = async (barcode, format) => {
    const value = barcode.trim();

    setBarcodeResult({ value, format });
    await lookupBarcodeProduct(value, format);
  };

  const scanBarcodeImage = async (file) => {
    if (!file) return;

    setBarcodeError("");
    setBarcodeResult(null);
    setReadingBarcodeImage(true);

    const scanner = new Html5Qrcode("barcode-reader", {
      formatsToSupport: BARCODE_FORMATS,
      useBarCodeDetectorIfSupported: true,
    });

    try {
      const result = await scanner.scanFileV2(file, false);
      const format =
        result.result.format?.formatName?.replaceAll("_", "-") || "Barcode";

      await handleDetectedBarcode(result.decodedText, format);
    } catch (error) {
      console.error("Barcode image scan error:", error);
      setBarcodeError(
        "No supported barcode was found in that photo. Use a clear, straight-on image or try the live scanner.",
      );
    } finally {
      scanner.clear();
      setReadingBarcodeImage(false);
    }
  };

  const startBarcodeScanner = async () => {
    setBarcodeError("");
    setBarcodeResult(null);

    let scanner;
    let hasDecodedBarcode = false;

    try {
      scanner = new Html5Qrcode("barcode-reader", {
        formatsToSupport: BARCODE_FORMATS,
        useBarCodeDetectorIfSupported: true,
      });
      qrScannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: (viewfinderWidth, viewfinderHeight) => ({
            width: Math.floor(viewfinderWidth * 0.9),
            height: Math.min(
              160,
              Math.max(60, Math.floor(viewfinderHeight * 0.35)),
            ),
          }),
        },
        async (decodedText, result) => {
          if (hasDecodedBarcode) return;
          hasDecodedBarcode = true;

          const format =
            result.result.format?.formatName?.replaceAll("_", "-") || "Barcode";

          setScanningBarcode(false);

          try {
            await scanner.stop();
            scanner.clear();
            if (qrScannerRef.current === scanner) qrScannerRef.current = null;
          } catch (stopError) {
            console.error("Could not stop barcode scanner:", stopError);
          }

          await handleDetectedBarcode(decodedText, format);
        },
        () => {},
      );

      setScanningBarcode(true);
    } catch (error) {
      console.error("Barcode scanner error:", error);
      setBarcodeError(
        "Could not start the camera. Allow camera access and try again.",
      );
      setScanningBarcode(false);

      try {
        if (scanner?.isScanning) await scanner.stop();
        scanner?.clear();
      } catch (cleanupError) {
        console.error("Could not clean up barcode scanner:", cleanupError);
      }

      if (qrScannerRef.current === scanner) qrScannerRef.current = null;
    }
  };

  const stopBarcodeScanner = async () => {
    const scanner = qrScannerRef.current;

    try {
      if (scanner?.isScanning) await scanner.stop();
      scanner?.clear();
    } catch (error) {
      console.error("Could not stop barcode scanner:", error);
      setBarcodeError("Could not stop the camera cleanly. Please try again.");
    } finally {
      qrScannerRef.current = null;
      setScanningBarcode(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleWarrantyChange = (e) => {
    const months = e.target.value;

    setFormData((previous) => {
      let warrantyExpiry = "";

      if (months && previous.purchase_date) {
        const date = new Date(previous.purchase_date);

        date.setMonth(date.getMonth() + Number(months));

        warrantyExpiry = date.toISOString().split("T")[0];
      }

      return {
        ...previous,
        warranty_months: months,
        warranty_expiry: warrantyExpiry,
      };
    });
  };

  const handlePurchaseDateChange = (e) => {
    const purchaseDate = e.target.value;

    setFormData((previous) => {
      let warrantyExpiry = "";

      if (purchaseDate && previous.warranty_months) {
        const date = new Date(purchaseDate);

        date.setMonth(date.getMonth() + Number(previous.warranty_months));

        warrantyExpiry = date.toISOString().split("T")[0];
      }

      return {
        ...previous,
        purchase_date: purchaseDate,
        warranty_expiry: warrantyExpiry,
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

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

      if (userError) {
        throw userError;
      }

      if (!user) {
        setError("You must be logged in to add an asset.");
        return;
      }

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

      if (insertError) {
        throw insertError;
      }
      // Upload product photo
      let productPhotoPath = null;
      let invoiceFilePath = null;

      if (productPhoto) {
        const photoExt = productPhoto.name.split(".").pop();
        productPhotoPath = `${user.id}/${asset.id}.${photoExt}`;

        const { error: photoUploadError } = await supabase.storage
          .from("asset-photos")
          .upload(productPhotoPath, productPhoto, {
            contentType: productPhoto.type,
          });

        if (photoUploadError) {
          throw photoUploadError;
        }
      }

      // Upload invoice or warranty document
      if (invoiceDocument) {
        const documentExt = invoiceDocument.name.split(".").pop();
        invoiceFilePath = `${user.id}/${asset.id}-invoice.${documentExt}`;

        const { error: documentUploadError } = await supabase.storage
          .from("asset-documents")
          .upload(invoiceFilePath, invoiceDocument, {
            contentType: invoiceDocument.type,
          });

        if (documentUploadError) {
          throw documentUploadError;
        }
      }

      // Save uploaded file paths in the assets table
      if (productPhotoPath || invoiceFilePath) {
        const { error: pathUpdateError } = await supabase
          .from("assets")
          .update({
            ...(productPhotoPath && {
              product_photo_path: productPhotoPath,
            }),
            ...(invoiceFilePath && {
              invoice_file_path: invoiceFilePath,
            }),
          })
          .eq("id", asset.id)
          .eq("user_id", user.id);

        if (pathUpdateError) {
          throw pathUpdateError;
        }
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
    `group flex cursor-pointer items-center gap-4 rounded-2xl border p-5 text-left transition ${
      activeMethod === method
        ? "border-blue-300 bg-blue-50/50 shadow-sm"
        : "border-slate-200 bg-white hover:border-blue-200 hover:shadow-sm"
    }`;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            to="/dashboard"
            className="flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-blue-600"
          >
            <FiArrowLeft size={17} />
            Back to Dashboard
          </Link>

          <div className="text-lg font-bold tracking-tight text-slate-900">
            AssetCare-AI
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        {/* Heading */}
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
            Add your product manually now. Bill scanning, QR, barcode and photo
            identification can be connected next.
          </p>
        </motion.div>

        {/* Add methods */}
        <motion.section
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3"
        >
          {/* Upload Bill */}
          <button
            type="button"
            onClick={() => setActiveMethod("upload")}
            className={methodClass("upload")}
          >
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
              <FiFileText size={24} />
            </div>

            <div>
              <h2 className="font-bold text-slate-900">Upload Bill</h2>

              <p className="mt-1 text-sm text-slate-500">PDF, JPG, PNG</p>
            </div>
          </button>

          {/* Scan Bill */}
          <button
            type="button"
            onClick={() => setActiveMethod("scan")}
            className={methodClass("scan")}
          >
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
              <FiCamera size={24} />
            </div>

            <div>
              <h2 className="font-bold text-slate-900">Scan Bill</h2>

              <p className="mt-1 text-sm text-slate-500">Use camera OCR</p>
            </div>
          </button>

          {/* Manual */}
          <button
            type="button"
            onClick={() => setActiveMethod("manual")}
            className={methodClass("manual")}
          >
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
              <FiEdit3 size={24} />
            </div>

            <div>
              <h2 className="font-bold text-slate-900">Manual Entry</h2>

              <p className="mt-1 text-sm text-slate-500">Type it yourself</p>
            </div>
          </button>

          {/* QR */}
          <button
            type="button"
            onClick={() => setActiveMethod("qr")}
            className={methodClass("qr")}
          >
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
              <FiGrid size={24} />
            </div>

            <div>
              <h2 className="font-bold text-slate-900">Scan QR Code</h2>

              <p className="mt-1 text-sm text-slate-500">Warranty QR</p>
            </div>
          </button>

          {/* Barcode */}
          <button
            type="button"
            onClick={() => setActiveMethod("barcode")}
            className={methodClass("barcode")}
          >
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
              <FiHash size={24} />
            </div>

            <div>
              <h2 className="font-bold text-slate-900">Scan Barcode</h2>

              <p className="mt-1 text-sm text-slate-500">EAN / UPC</p>
            </div>
          </button>

          {/* Product photo */}
          <button
            type="button"
            onClick={() => setActiveMethod("photo")}
            className={methodClass("photo")}
          >
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
              <FiImage size={24} />
            </div>

            <div>
              <h2 className="font-bold text-slate-900">Product Photo</h2>

              <p className="mt-1 text-sm text-slate-500">Auto identify</p>
            </div>
          </button>
        </motion.section>

        {/* Notice */}
        {["scan", "qr", "barcode"].includes(activeMethod) && (
          <>
            {activeMethod === "qr" ? (
              <div className="mb-6 rounded-2xl border border-blue-200 bg-blue-50 p-5">
                <h3 className="font-semibold text-blue-800">
                  Scan Warranty QR Code
                </h3>
                <p className="mt-1 text-sm text-blue-700">
                  Use your camera to scan the QR code on your product or
                  warranty card.
                </p>

                <div
                  id="qr-reader"
                  ref={qrScannerRef}
                  className="mt-4 w-full max-w-md"
                />

                {!scanningQR && (
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        setQrResult("");
                        setQrError("");

                        const scanner = new Html5Qrcode("qr-reader");
                        qrScannerRef.current = scanner;
                        await scanner.start(
                          { facingMode: "environment" },
                          { fps: 10, qrbox: { width: 250, height: 250 } },
                          async (decodedText) => {
                            setQrResult(decodedText);
                            setScanningQR(false);

                            const value = decodedText.trim();

                            try {
                              // Try to read structured JSON product details from the QR code.
                              const product = JSON.parse(value);

                              if (
                                product &&
                                typeof product === "object" &&
                                !Array.isArray(product)
                              ) {
                                setFormData((prev) => ({
                                  ...prev,
                                  product_name:
                                    product.product_name ||
                                    product.productName ||
                                    prev.product_name,
                                  brand: product.brand || prev.brand,
                                  model: product.model || prev.model,
                                  serial_number:
                                    product.serial_number ||
                                    product.serialNumber ||
                                    prev.serial_number,
                                  invoice_number:
                                    product.invoice_number ||
                                    product.invoiceNumber ||
                                    prev.invoice_number,
                                  purchase_date:
                                    product.purchase_date ||
                                    product.purchaseDate ||
                                    prev.purchase_date,
                                  warranty_months:
                                    product.warranty_months ??
                                    product.warrantyMonths ??
                                    prev.warranty_months,
                                  warranty_expiry:
                                    product.warranty_expiry ||
                                    product.warrantyExpiry ||
                                    prev.warranty_expiry,
                                }));
                                setQrError(
                                  "Product details were filled from the QR code.",
                                );
                              } else {
                                setQrError(
                                  "This QR code does not contain structured product details.",
                                );
                              }
                            } catch {
                              if (/^https?:\/\//i.test(value)) {
                                setQrError(
                                  "This QR code contains a website link. Automatic product lookup is not configured yet.",
                                );
                              } else {
                                setFormData((prev) => ({
                                  ...prev,
                                  serial_number: prev.serial_number || value,
                                }));
                                setQrError(
                                  "Only a product identifier was found. Other details need to be entered manually.",
                                );
                              }
                            }

                            try {
                              await scanner.stop();
                              scanner.clear();
                              qrScannerRef.current = null;
                            } catch (stopError) {
                              console.error(
                                "Could not stop QR scanner:",
                                stopError,
                              );
                            }
                          },
                          () => {},
                        );

                        setScanningQR(true);
                      } catch (err) {
                        setQrError(
                          "Could not start the camera. Please allow camera access and try again.",
                        );
                        setScanningQR(false);
                        console.error("QR scanner error:", err);
                      }
                    }}
                    className="mt-4 rounded-xl bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700"
                  >
                    Start QR Scanner
                  </button>
                )}

                {qrResult && (
                  <p className="mt-3 break-all text-sm text-green-700">
                    Scanned result: {qrResult}
                  </p>
                )}

                {qrError && (
                  <p className="mt-3 text-sm text-red-600">{qrError}</p>
                )}
              </div>
            ) : (
              <div className="mb-6 rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4 text-sm text-blue-700">
                <span className="font-semibold">
                  {activeMethod === "scan" && "Scan Bill"}
                  {activeMethod === "barcode" && "Scan Barcode"}
                </span>{" "}
                {activeMethod === "scan" ? (
                  <div className="mb-6 rounded-2xl border border-blue-200 bg-blue-50 p-5">
                    <h3 className="font-semibold text-blue-800">
                      Scan Purchase Bill
                    </h3>

                    <p className="mt-1 text-sm text-blue-700">
                      Take a clear photo of your bill to extract purchase and
                      warranty details.
                    </p>

                    <input
                      id="scan-bill-input"
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={(e) => {
                        setScannedBill(e.target.files?.[0] || null);
                        setExtractionMessage("");
                      }}
                      className="hidden"
                    />

                    <label
                      htmlFor="scan-bill-input"
                      className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-700"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M14 4h6v6" />
                        <path d="M20 4 12 12" />
                        <path d="M20 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h5" />
                      </svg>
                      Scan Bill
                    </label>

                    {scannedBill && (
                      <>
                        <p className="mt-3 text-sm text-slate-600">
                          Selected: {scannedBill.name}
                        </p>

                        <button
                          type="button"
                          onClick={() => handleWarrantyExtraction(scannedBill)}
                          disabled={extracting}
                          className="mt-4 rounded-xl bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                          {extracting
                            ? "Analyzing bill..."
                            : "Extract Bill Details"}
                        </button>
                      </>
                    )}

                    {extractionMessage && (
                      <p className="mt-3 text-sm text-slate-600">
                        {extractionMessage}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="mb-6 rounded-2xl border border-blue-200 bg-blue-50 p-5">
                    <h3 className="font-semibold text-blue-800">
                      Scan Barcode
                    </h3>
                    <p className="mt-1 text-sm text-blue-700">
                      Center the barcode horizontally in the frame, or scan a
                      clear barcode photo. A catalog match can fill the product
                      name, brand, and category.
                    </p>
                    <div
                      id="barcode-reader"
                      className="mt-4 w-full max-w-md overflow-hidden rounded-xl"
                    />
                    {lookingUpBarcode || readingBarcodeImage ? (
                      <button
                        type="button"
                        disabled
                        className="mt-4 rounded-xl bg-blue-600 px-5 py-3 font-medium text-white opacity-60"
                      >
                        {readingBarcodeImage
                          ? "Reading barcode photo..."
                          : "Looking up product details..."}
                      </button>
                    ) : scanningBarcode ? (
                      <button
                        type="button"
                        onClick={stopBarcodeScanner}
                        className="mt-4 rounded-xl border border-slate-300 bg-white px-5 py-3 font-medium text-slate-700 hover:bg-slate-50"
                      >
                        Stop Camera
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={startBarcodeScanner}
                        className="mt-4 rounded-xl bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700"
                      >
                        Start Barcode Scanner
                      </button>
                    )}
                    <label className="mt-4 block text-sm font-medium text-slate-700">
                      Scan from a photo
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        disabled={
                          scanningBarcode ||
                          readingBarcodeImage ||
                          lookingUpBarcode
                        }
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          event.target.value = "";
                          scanBarcodeImage(file);
                        }}
                        className="mt-2 block w-full text-sm font-normal text-slate-600 disabled:opacity-50"
                      />
                    </label>
                    {barcodeResult && (
                      <p
                        className="mt-3 break-all text-sm text-green-700"
                        aria-live="polite"
                      >
                        Scanned {barcodeResult.format}: {barcodeResult.value}
                      </p>
                    )}
                    {(barcodeResult?.productName || barcodeResult?.brand) && (
                      <p className="mt-2 text-sm text-green-700">
                        Catalog match: {barcodeResult.productName}
                        {barcodeResult.productName && barcodeResult.brand
                          ? " | "
                          : ""}
                        {barcodeResult.brand}. Matching details were added to
                        empty form fields.
                      </p>
                    )}
                    {barcodeError && (
                      <p className="mt-3 text-sm text-red-600" role="alert">
                        {barcodeError}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Manual form */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/40 sm:p-8"
        >
          <div className="mb-7">
            <h2 className="text-lg font-bold text-slate-900">
              Or fill the details manually
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Enter the information from your bill or product.
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-600">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="grid gap-x-5 gap-y-5 md:grid-cols-2 xl:grid-cols-3">
              {/* Product name */}
              <div className="md:col-span-2 xl:col-span-3">
                <label
                  htmlFor="product_name"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Product Name *
                </label>

                <input
                  id="product_name"
                  name="product_name"
                  type="text"
                  value={formData.product_name}
                  onChange={handleChange}
                  placeholder="Example: Samsung Washing Machine"
                  className={inputClass}
                />
              </div>

              {/* Brand */}
              <div>
                <label
                  htmlFor="brand"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Brand
                </label>

                <input
                  id="brand"
                  name="brand"
                  type="text"
                  value={formData.brand}
                  onChange={handleChange}
                  placeholder="Brand"
                  className={inputClass}
                />
              </div>

              {/* Category */}
              <div>
                <label
                  htmlFor="category"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Category
                </label>

                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className={inputClass}
                >
                  <option value="">Category</option>
                  <option value="Home & household products">
                    Home & household products
                  </option>
                  <option value="Personal electronics">
                    Personal electronics
                  </option>
                  <option value="Vehicles">Vehicles</option>
                  <option value="Appliances">Appliances</option>
                  <option value="Business assets">Business assets</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Model */}
              <div>
                <label
                  htmlFor="model"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Model
                </label>

                <input
                  id="model"
                  name="model"
                  type="text"
                  value={formData.model}
                  onChange={handleChange}
                  placeholder="Model"
                  className={inputClass}
                />
              </div>

              {/* Serial */}
              <div>
                <label
                  htmlFor="serial_number"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Serial Number
                </label>

                <input
                  id="serial_number"
                  name="serial_number"
                  type="text"
                  value={formData.serial_number}
                  onChange={handleChange}
                  placeholder="Serial Number"
                  className={inputClass}
                />
              </div>

              {/* Product Photo Upload */}

              {/* Product Photo Upload */}
              {activeMethod === "photo" && (
                <div className="md:col-span-2 xl:col-span-3">
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Product Photo
                  </label>

                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setProductPhoto(file);
                    }}
                    className={inputClass}
                  />

                  {productPhoto && (
                    <div className="mt-4">
                      <p className="mb-2 text-sm font-medium text-slate-700">
                        Photo preview
                      </p>

                      <img
                        src={URL.createObjectURL(productPhoto)}
                        alt="Product preview"
                        className="h-48 w-48 rounded-xl border border-slate-200 object-cover"
                      />

                      <button
                        type="button"
                        onClick={() => setProductPhoto(null)}
                        className="mt-3 block text-sm font-medium text-red-600 hover:text-red-700"
                      >
                        Remove photo
                      </button>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => handleWarrantyExtraction(productPhoto)}
                    disabled={extracting || !productPhoto}
                    className="mt-4 rounded-xl bg-indigo-600 px-5 py-3 font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {extracting
                      ? "Analyzing product photo..."
                      : "Extract Details with AI"}
                  </button>

                  {extractionMessage && (
                    <p className="mt-3 text-sm text-slate-600">
                      {extractionMessage}
                    </p>
                  )}
                </div>
              )}

              {/* Invoice / Warranty Document — Manual Entry only */}
              {/* Invoice / Warranty Document — Upload Bill mode only */}
              {activeMethod === "upload" && (
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Invoice / Warranty Document
                  </label>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) =>
                      setInvoiceDocument(e.target.files[0] || null)
                    }
                    className={inputClass}
                  />

                  <button
                    type="button"
                    onClick={() => handleWarrantyExtraction(invoiceDocument)}
                    disabled={
                      extracting ||
                      !invoiceDocument ||
                      !["image/jpeg", "image/png", "image/webp"].includes(
                        invoiceDocument?.type,
                      )
                    }
                    className="mt-3 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {extracting
                      ? "Analyzing warranty card..."
                      : "Extract Details with AI"}
                  </button>

                  {extractionMessage && (
                    <p className="mt-2 text-sm text-slate-600">
                      {extractionMessage}
                    </p>
                  )}
                </div>
              )}

              {/* Invoice */}
              <div>
                <label
                  htmlFor="invoice_number"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Invoice Number
                </label>

                <input
                  id="invoice_number"
                  name="invoice_number"
                  type="text"
                  value={formData.invoice_number}
                  onChange={handleChange}
                  placeholder="Invoice Number"
                  className={inputClass}
                />
              </div>

              {/* Purchase date */}
              <div>
                <label
                  htmlFor="purchase_date"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Purchase Date
                </label>

                <input
                  id="purchase_date"
                  name="purchase_date"
                  type="date"
                  value={formData.purchase_date}
                  onChange={handlePurchaseDateChange}
                  className={inputClass}
                />
              </div>

              {/* Warranty */}
              <div>
                <label
                  htmlFor="warranty_months"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Warranty (months)
                </label>

                <input
                  id="warranty_months"
                  name="warranty_months"
                  type="number"
                  min="0"
                  value={formData.warranty_months}
                  onChange={handleWarrantyChange}
                  placeholder="Warranty (months)"
                  className={inputClass}
                />

                {formData.warranty_expiry && (
                  <p className="mt-2 text-xs text-slate-500">
                    Warranty expires on{" "}
                    <span className="font-semibold text-slate-700">
                      {new Date(formData.warranty_expiry).toLocaleDateString(
                        "en-IN",
                        {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        },
                      )}
                    </span>
                  </p>
                )}
              </div>

              {/* Store */}
              <div>
                <label
                  htmlFor="store_name"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Store
                </label>

                <input
                  id="store_name"
                  name="store_name"
                  type="text"
                  value={formData.store_name}
                  onChange={handleChange}
                  placeholder="Store"
                  className={inputClass}
                />
              </div>

              {/* Price */}
              <div>
                <label
                  htmlFor="purchase_price"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Price
                </label>

                <input
                  id="purchase_price"
                  name="purchase_price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.purchase_price}
                  onChange={handleChange}
                  placeholder="Price"
                  className={inputClass}
                />
              </div>

              {/* Location */}
              <div>
                <label
                  htmlFor="location_in_home"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Location in Home
                </label>

                <input
                  id="location_in_home"
                  name="location_in_home"
                  type="text"
                  value={formData.location_in_home}
                  onChange={handleChange}
                  placeholder="Example: Kitchen"
                  className={inputClass}
                />
              </div>

              {/* Warranty expiry */}
              <div>
                <label
                  htmlFor="warranty_expiry"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Warranty Expiry
                </label>

                <input
                  id="warranty_expiry"
                  name="warranty_expiry"
                  type="date"
                  value={formData.warranty_expiry}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>

              {/* Notes */}
              <div className="md:col-span-2 xl:col-span-3">
                <label
                  htmlFor="notes"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Notes
                </label>

                <textarea
                  id="notes"
                  name="notes"
                  rows={4}
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Add any additional information..."
                  className={`${inputClass} resize-none`}
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="mt-8 flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                className="rounded-xl px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                Cancel
              </button>

              <motion.button
                type="submit"
                disabled={saving}
                whileHover={!saving ? { y: -2 } : {}}
                whileTap={!saving ? { scale: 0.98 } : {}}
                className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FiSave size={17} />

                {saving ? "Saving..." : "Save Product"}
              </motion.button>
            </div>
          </form>
        </motion.section>
      </main>
    </div>
  );
}

export default AddAsset;
