import React, { useState } from 'react';
import { Icons } from './Icons';

interface OnboardingModalProps {
    onClose: () => void;
    onOpenSettings: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ onClose, onOpenSettings }) => {
    const [currentStep, setCurrentStep] = useState(0);

    const steps = [
        {
            title: "Welcome to Omi Manager! 🎉",
            icon: Icons.Sparkles,
            content: (
                <div className="space-y-4">
                    <p className="text-gray-600 dark:text-gray-300">
                        Your personal tool to manage and organize your <strong>Limitless chats</strong> and <strong>lifelogs</strong> more effectively.
                    </p>
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-500/30 rounded-xl p-4">
                        <p className="text-sm text-blue-800 dark:text-blue-200 flex items-start gap-2">
                            <Icons.Alert className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <span>This is an independent app, not affiliated with Limitless.ai. Your data is securely stored on Google Cloud servers.</span>
                        </p>
                    </div>
                </div>
            )
        },
        {
            title: "Step 1: Connect Your Limitless Account",
            icon: Icons.Settings,
            content: (
                <div className="space-y-4">
                    <p className="text-gray-600 dark:text-gray-300">
                        To sync your data, you need to add your <strong>Limitless API Token</strong>:
                    </p>
                    <ol className="space-y-3 text-sm">
                        <li className="flex items-start gap-3">
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-bold">1</span>
                            <span className="text-gray-600 dark:text-gray-300">
                                Visit <a href="https://limitless.ai/developers" target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1">
                                    limitless.ai/developers <Icons.ExternalLink className="w-3 h-3" />
                                </a>
                            </span>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-bold">2</span>
                            <span className="text-gray-600 dark:text-gray-300">Copy your API token</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-bold">3</span>
                            <span className="text-gray-600 dark:text-gray-300">Paste it in Settings → Limitless API Token</span>
                        </li>
                    </ol>
                    <button
                        onClick={() => {
                            onClose();
                            onOpenSettings();
                        }}
                        className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors"
                    >
                        <Icons.Settings className="w-4 h-4" />
                        Open Settings Now
                    </button>
                </div>
            )
        },
        {
            title: "Dashboard: Your Overview",
            icon: Icons.Grid,
            content: (
                <div className="space-y-4">
                    <p className="text-gray-600 dark:text-gray-300">
                        The <strong>Dashboard</strong> gives you a quick overview of your data:
                    </p>
                    <ul className="space-y-3">
                        <li className="flex items-start gap-3">
                            <Icons.CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-600 dark:text-gray-300">See total chats, favorites, and lifelogs at a glance</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <Icons.CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-600 dark:text-gray-300">Quick access to recent chats and lifelogs</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <Icons.CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-600 dark:text-gray-300">Navigate to different sections with one click</span>
                        </li>
                    </ul>
                </div>
            )
        },
        {
            title: "Chats: Organize Conversations",
            icon: Icons.MessageSquare,
            content: (
                <div className="space-y-4">
                    <p className="text-gray-600 dark:text-gray-300">
                        Manage your <strong>Limitless AI conversations</strong>:
                    </p>
                    <ul className="space-y-3">
                        <li className="flex items-start gap-3">
                            <Icons.Sync className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-600 dark:text-gray-300">Sync chats from your Limitless account</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <Icons.Folder className="w-5 h-5 text-purple-500 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-600 dark:text-gray-300">Organize chats into custom folders</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <Icons.Star className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-600 dark:text-gray-300">Mark important chats as favorites</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <Icons.Tag className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-600 dark:text-gray-300">Add custom tags for better filtering</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <Icons.Search className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-600 dark:text-gray-300">Search and filter by date, tags, or keywords</span>
                        </li>
                    </ul>
                </div>
            )
        },
        {
            title: "Lifelogs: Your Digital Journal",
            icon: Icons.BookOpen,
            content: (
                <div className="space-y-4">
                    <p className="text-gray-600 dark:text-gray-300">
                        Browse and organize your <strong>Limitless lifelogs</strong> (daily recordings):
                    </p>
                    <ul className="space-y-3">
                        <li className="flex items-start gap-3">
                            <Icons.Calendar className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-600 dark:text-gray-300">View lifelogs by day, week, or custom date range</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <Icons.Search className="w-5 h-5 text-purple-500 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-600 dark:text-gray-300">Search through all your recordings</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <Icons.Tag className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-600 dark:text-gray-300">Tag and categorize your memories</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <Icons.Star className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-600 dark:text-gray-300">Star important moments for quick access</span>
                        </li>
                    </ul>
                </div>
            )
        },
        {
            title: "You're All Set! 🚀",
            icon: Icons.CheckCircle,
            content: (
                <div className="space-y-4">
                    <p className="text-gray-600 dark:text-gray-300">
                        You're ready to start organizing your digital memory!
                    </p>
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-500/30 rounded-xl p-4">
                        <p className="text-sm text-gray-700 dark:text-gray-200 font-medium mb-2">
                            Quick Tips:
                        </p>
                        <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                            <li className="flex items-start gap-2">
                                <span className="text-blue-500">•</span>
                                <span>Use the context switcher (top of sidebar) to toggle between Dashboard, Chats, and Lifelogs</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-blue-500">•</span>
                                <span>Click your profile picture to access Settings or Edit Profile</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-blue-500">•</span>
                                <span>Your data syncs automatically - no need to manually save</span>
                            </li>
                        </ul>
                    </div>
                </div>
            )
        }
    ];

    const step = steps[currentStep];
    const StepIcon = step.icon;

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            onClose();
        }
    };

    const handlePrev = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    return (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl sm:rounded-3xl shadow-2xl border border-gray-200 dark:border-white/10 animate-in zoom-in-95 duration-300 max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">

                {/* Progress Bar */}
                <div className="h-1 bg-gray-200 dark:bg-gray-800">
                    <div
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
                        style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                    />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between p-3 sm:p-6 border-b border-gray-200 dark:border-white/10">
                    <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                        <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 flex-shrink-0">
                            <StepIcon className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <h2 className="text-base sm:text-xl font-bold text-gray-900 dark:text-white truncate">{step.title}</h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Step {currentStep + 1} of {steps.length}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 sm:p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg sm:rounded-xl transition-colors flex-shrink-0 ml-2"
                    >
                        <Icons.Close className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 dark:text-gray-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-3 sm:p-6">
                    <div className="text-sm sm:text-base">
                        {step.content}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-3 sm:p-6 border-t border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
                    <button
                        onClick={handlePrev}
                        disabled={currentStep === 0}
                        className="order-2 sm:order-1 w-full sm:w-auto px-4 py-2 rounded-lg sm:rounded-xl border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
                    >
                        <Icons.ChevronLeft className="w-4 h-4" />
                        <span className="hidden sm:inline">Previous</span>
                        <span className="sm:hidden">Prev</span>
                    </button>

                    {/* Progress Dots - Hidden on very small screens */}
                    <div className="hidden xs:flex gap-1.5 sm:gap-2 order-1 sm:order-2">
                        {steps.map((_, index) => (
                            <div
                                key={index}
                                className={`h-1.5 sm:h-2 rounded-full transition-all ${index === currentStep
                                    ? 'w-6 sm:w-8 bg-gradient-to-r from-blue-500 to-purple-500'
                                    : 'w-1.5 sm:w-2 bg-gray-300 dark:bg-gray-700'
                                    }`}
                            />
                        ))}
                    </div>

                    {/* Step counter for very small screens */}
                    <div className="xs:hidden text-xs text-gray-500 dark:text-gray-400 order-1 sm:order-2">
                        {currentStep + 1} / {steps.length}
                    </div>

                    <button
                        onClick={handleNext}
                        className="order-3 w-full sm:w-auto px-4 sm:px-6 py-2 rounded-lg sm:rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-medium transition-all flex items-center justify-center gap-2 text-sm sm:text-base"
                    >
                        {currentStep === steps.length - 1 ? (
                            <>
                                Get Started
                                <Icons.Check className="w-4 h-4" />
                            </>
                        ) : (
                            <>
                                Next
                                <Icons.ChevronRight className="w-4 h-4" />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
