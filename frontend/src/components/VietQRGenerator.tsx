import React, { useEffect, useState } from "react";
import axios from "axios";

interface VietQRProps {
    accountNo: string;
    accountName: string;
    amount: number;
    addInfo: string;
    onQRGenerated?: (url: string) => void;
}

const VietQRGenerator: React.FC<VietQRProps> = ({
    accountNo,
    accountName,
    amount,
    addInfo,
    onQRGenerated
}) => {
    const [qrImage, setQrImage] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchQR = async () => {
            try {
                setLoading(true);
                setError(null);
                console.log("Generating VietQR with data:", { accountNo, accountName, amount, addInfo });

                // First try with acqId (for newer API versions)
                try {
                    const response = await axios.post("https://api.vietqr.io/v2/generate", {
                        acqId: "970418", // Mã ngân hàng BIDV
                        accountNo,
                        accountName,
                        amount,
                        addInfo,
                        template: "compact"
                    });

                    console.log("VietQR API response:", response.data);

                    if (response.data && response.data.data && response.data.data.qrDataURL) {
                        const url = response.data.data.qrDataURL;
                        setQrImage(url);
                        if (onQRGenerated) {
                            onQRGenerated(url);
                        }
                        setLoading(false);
                        return;
                    } else if (response.data && response.data.code) {
                        console.warn(`API returned error code: ${response.data.code}, ${response.data.desc}`);
                        // Continue to try alternative method
                    }
                } catch (firstError) {
                    console.warn("First VietQR attempt failed:", firstError);
                    // Continue to try alternative method
                }

                // Second attempt with direct bank parameter
                try {
                    const response = await axios.post("https://api.vietqr.io/v2/generate", {
                        bank: "BIDV",
                        accountNo,
                        accountName,
                        amount,
                        addInfo,
                        template: "compact"
                    });

                    console.log("VietQR API second attempt response:", response.data);

                    if (response.data && response.data.data && response.data.data.qrDataURL) {
                        const url = response.data.data.qrDataURL;
                        setQrImage(url);
                        if (onQRGenerated) {
                            onQRGenerated(url);
                        }
                        setLoading(false);
                        return;
                    }
                } catch (secondError) {
                    console.warn("Second VietQR attempt failed:", secondError);
                }

                // If both methods fail, try a fallback method using the image API
                const fallbackUrl = `https://img.vietqr.io/image/BIDV-${accountNo}-${encodeURIComponent(accountName)}-${amount}-${encodeURIComponent(addInfo)}.png`;
                console.log("Using fallback image URL:", fallbackUrl);
                setQrImage(fallbackUrl);
                if (onQRGenerated) {
                    onQRGenerated(fallbackUrl);
                }
            } catch (error) {
                console.error("Error generating VietQR:", error);
                setError("Failed to generate QR code");

                // Last resort fallback
                try {
                    const fallbackUrl = `https://img.vietqr.io/image/BIDV-${accountNo}-compact2.png`;
                    setQrImage(fallbackUrl);
                    if (onQRGenerated) {
                        onQRGenerated(fallbackUrl);
                    }
                } catch (fallbackError) {
                    setError("All VietQR generation methods failed");
                }
            } finally {
                setLoading(false);
            }
        };

        fetchQR();
    }, [accountNo, accountName, amount, addInfo, onQRGenerated]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-[200px]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center p-4 bg-red-500/10 border border-red-500 rounded-lg">
                <p className="text-red-400">{error}</p>
                <p className="text-sm text-gray-400 mt-2">Please try another payment method</p>
            </div>
        );
    }

    return (
        <div className="text-center">
            {qrImage ? (
                <div className="flex flex-col items-center">
                    <img
                        src={qrImage}
                        alt="VietQR BIDV"
                        className="mx-auto max-w-[200px] max-h-[200px]"
                        onError={(e) => {
                            console.error("QR image failed to load:", qrImage.substring(0, 100) + "...");
                            setError("Failed to load QR image");
                            // Show the error even if the image fails to load
                            e.currentTarget.style.display = "none";
                        }}
                    />
                    {error && (
                        <div className="mt-2 text-red-400 text-sm">
                            {error}
                            <button
                                className="ml-2 text-primary underline"
                                onClick={() => window.location.reload()}
                            >
                                Reload
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                <div className="bg-gray-800 p-4 rounded-lg">
                    <p className="text-gray-400">QR code generation failed</p>
                    <p className="text-sm text-gray-500 mt-2">Try selecting a different payment method</p>
                </div>
            )}
        </div>
    );
};

export default VietQRGenerator; 