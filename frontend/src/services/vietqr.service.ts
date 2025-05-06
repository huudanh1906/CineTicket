import axios from 'axios';

interface VietQRPayload {
    bin: string;
    accountNo: string;
    accountName: string;
    amount: number;
    addInfo: string;
    template: string;
}

/**
 * Service to handle VietQR API integration
 * Using the official VietQR API: https://api.vietqr.io/v2/generate
 */
class VietQRService {
    private API_URL = 'https://api.vietqr.io/v2/generate';

    /**
     * Generate a VietQR image URL using the API
     * 
     * @param accountNo - Bank account number
     * @param accountName - Account holder name
     * @param bankBin - Bank BIN (e.g., '970418' for BIDV)
     * @param amount - Payment amount
     * @param addInfo - Additional payment information/content
     * @returns A promise with the URL to the QR code image
     */
    async generateQR(
        accountNo: string,
        accountName: string,
        bankBin: string,
        amount: number,
        addInfo: string
    ): Promise<string> {
        try {
            const payload: VietQRPayload = {
                bin: bankBin,
                accountNo,
                accountName,
                amount,
                addInfo,
                template: 'compact'
            };

            const response = await axios.post(this.API_URL, payload);

            if (response.data && response.data.data && response.data.data.qrDataURL) {
                return response.data.data.qrDataURL;
            } else {
                throw new Error('Invalid response from VietQR API');
            }
        } catch (error) {
            console.error('Error generating VietQR:', error);
            throw error;
        }
    }

    /**
     * Get a fallback QR image URL in case the API fails
     */
    getFallbackQRUrl(
        accountNo: string,
        accountName: string,
        bankId: string,
        amount: number,
        addInfo: string
    ): string {
        // Fallback to the direct image API
        return `https://img.vietqr.io/image/${bankId}/${accountNo}/${encodeURIComponent(accountName)}/${amount}/${encodeURIComponent(addInfo)}.png`;
    }
}

export default new VietQRService(); 