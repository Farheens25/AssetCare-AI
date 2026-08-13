import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import {
  FiArrowLeft,
  FiArrowRight,
  FiCheck,
  FiCpu,
  FiShield,
} from "react-icons/fi";

const questions = [
  {
    id: "categories",
    title: "What would you like to manage?",
    description:
      "Choose the types of products and assets you want AssetCare-AI to help you manage.",
    type: "multiple",
    options: [
      "Home & household products",
      "Personal electronics",
      "Vehicles",
      "Appliances",
      "Business assets",
    ],
  },
  {
    id: "assetCount",
    title: "How many products do you want to track?",
    description: "This helps us understand how many assets you may manage.",
    type: "single",
    options: [
      "1–5 products",
      "6–15 products",
      "16–30 products",
      "30+ products",
    ],
  },
  {
    id: "tracking",
    title: "What information should AssetCare track?",
    description:
      "Select the information you want to keep organized for your products.",
    type: "multiple",
    options: [
      "Bills & invoices",
      "Warranty information",
      "Service & maintenance",
      "Insurance",
      "Documents & manuals",
      "Purchase information",
    ],
  },
  {
    id: "reminders",
    title: "What would you like to be reminded about?",
    description:
      "Choose the important dates and activities you don't want to forget.",
    type: "multiple",
    options: [
      "Warranty expiry",
      "Service & maintenance",
      "Insurance renewal",
      "AMC renewal",
      "Bill & payment reminders",
      "Filter & battery replacement",
    ],
  },
  {
    id: "ai",
    title: "How would you like AI to help?",
    description:
      "Choose the ways AssetCare-AI can make managing your products easier.",
    type: "multiple",
    options: [
      "Understand bills & warranties",
      "Find product information",
      "Organize documents",
      "Decide repair vs replace",
      "Predict maintenance needs",
      "Give me useful reminders",
    ],
  },
];

function Onboarding() {
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(0);

  const [answers, setAnswers] = useState({
    categories: [],
    assetCount: "",
    tracking: [],
    reminders: [],
    ai: [],
  });

  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const question = questions[currentStep];
  const currentAnswer = answers[question.id];

  const progress = ((currentStep + 1) / questions.length) * 100;

  const handleSingleSelect = (option) => {
    setAnswers((previous) => ({
      ...previous,
      [question.id]: option,
    }));
  };

  const handleMultipleSelect = (option) => {
    setAnswers((previous) => {
      const selected = previous[question.id];

      if (selected.includes(option)) {
        return {
          ...previous,
          [question.id]: selected.filter((item) => item !== option),
        };
      }

      return {
        ...previous,
        [question.id]: [...selected, option],
      };
    });
  };

  const isSelected = (option) => {
    if (question.type === "single") {
      return currentAnswer === option;
    }

    return currentAnswer.includes(option);
  };

  const canContinue =
    question.type === "single"
      ? Boolean(currentAnswer)
      : currentAnswer.length > 0;

  const handleContinue = async () => {
    if (!canContinue || saving) return;

    setError("");

    if (currentStep < questions.length - 1) {
      setCurrentStep((previous) => previous + 1);
      return;
    }

    /*
      Last step:
      Save onboarding answers to Supabase.
    */

    setSaving(true);

    try {
      // Get currently logged-in user
      const { data, error: userError } = await supabase.auth.getUser();
      const user = data?.user;

      if (userError) {
        throw userError;
      }

      if (!user) {
        setError("Your session has expired. Please login again.");
        navigate("/login");
        return;
      }

      // Save onboarding data
      const { error: insertError } = await supabase
        .from("onboarding_preferences")
        .upsert(
          {
            user_id: user.id,
            categories: answers.categories,
            asset_count: answers.assetCount,
            tracking: answers.tracking,
            reminders: answers.reminders,
            ai_preferences: answers.ai,
          },
          {
            onConflict: "user_id",
          },
        );

      if (insertError) {
        throw insertError;
      }

      console.log("Onboarding saved successfully:", answers);

      navigate("/dashboard");
    } catch (err) {
      console.error("Onboarding error:", err);
      setError(err.message || "Unable to save your preferences.");
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((previous) => previous - 1);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50">
      {/* Background glow */}
      <motion.div
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.1, 0.18, 0.1],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-blue-300 blur-3xl"
      />

      <motion.div
        animate={{
          x: [0, 25, 0],
          y: [0, -15, 0],
        }}
        transition={{
          duration: 7,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="pointer-events-none absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-blue-200/60 blur-3xl"
      />

      {/* Header */}
      <header className="relative border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="text-xl font-bold tracking-tight text-slate-900"
          >
            AssetCare-AI
          </button>

          <div className="flex items-center gap-2 text-sm text-slate-500">
            <FiShield size={15} />

            <span className="hidden sm:inline">
              Personalize your experience
            </span>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="relative px-6 py-10 sm:py-14">
        <div className="mx-auto w-full max-w-3xl">
          {/* Intro */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8 text-center"
          >
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
              <FiCpu size={23} />
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Let's personalize AssetCare-AI
            </h1>

            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500 sm:text-base">
              Answer a few quick questions so we can make your asset management
              experience more useful.
            </p>
          </motion.div>

          {/* Progress */}
          <div className="mb-6">
            <div className="mb-2 flex items-center justify-between text-xs font-medium text-slate-500">
              <span>
                Question {currentStep + 1} of {questions.length}
              </span>

              <span>{Math.round(progress)}%</span>
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-slate-200">
              <motion.div
                className="h-full rounded-full bg-blue-600"
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
            >
              {error}
            </motion.div>
          )}

          {/* Question Card */}
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/50">
            <AnimatePresence mode="wait">
              <motion.div
                key={question.id}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.3 }}
                className="p-6 sm:p-8"
              >
                {/* Question heading */}
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">
                    {question.title}
                  </h2>

                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                    {question.description}
                  </p>
                </div>

                {/* Options */}
                <div className="mt-7 space-y-3">
                  {question.options.map((option, index) => {
                    const selected = isSelected(option);

                    return (
                      <motion.button
                        key={option}
                        type="button"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          duration: 0.3,
                          delay: index * 0.04,
                        }}
                        whileHover={{ y: -1 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() =>
                          question.type === "single"
                            ? handleSingleSelect(option)
                            : handleMultipleSelect(option)
                        }
                        className={`flex w-full items-center gap-4 rounded-xl border p-4 text-left transition ${
                          selected
                            ? "border-blue-500 bg-blue-50 shadow-sm"
                            : "border-slate-200 bg-white hover:border-blue-200 hover:bg-slate-50"
                        }`}
                      >
                        {/* Selection indicator */}
                        <span
                          className={`flex h-5 w-5 shrink-0 items-center justify-center border transition ${
                            question.type === "single"
                              ? "rounded-full"
                              : "rounded-md"
                          } ${
                            selected
                              ? "border-blue-600 bg-blue-600 text-white"
                              : "border-slate-300 bg-white"
                          }`}
                        >
                          {selected && <FiCheck size={13} />}
                        </span>

                        <span
                          className={`text-sm font-medium ${
                            selected ? "text-blue-900" : "text-slate-700"
                          }`}
                        >
                          {option}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>

                {/* Navigation */}
                <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-6">
                  <button
                    type="button"
                    onClick={handleBack}
                    disabled={currentStep === 0 || saving}
                    className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <FiArrowLeft size={17} />
                    Back
                  </button>

                  <motion.button
                    type="button"
                    onClick={handleContinue}
                    disabled={!canContinue || saving}
                    whileHover={canContinue && !saving ? { y: -2 } : {}}
                    whileTap={canContinue && !saving ? { scale: 0.98 } : {}}
                    className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {saving
                      ? "Saving..."
                      : currentStep === questions.length - 1
                        ? "Finish"
                        : "Continue"}

                    {!saving && <FiArrowRight size={17} />}
                  </motion.button>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer note */}
          <p className="mt-5 text-center text-xs text-slate-400">
            You can update your preferences later from Settings.
          </p>
        </div>
      </main>
    </div>
  );
}

export default Onboarding;
