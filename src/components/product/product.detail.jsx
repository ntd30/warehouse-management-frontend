import { Modal, Descriptions, Typography, Button, message } from 'antd';
import QRCode from 'qrcode.react';

// Modal hiển thị chi tiết sản phẩm
const ProductDetailModal = ({ visible, onCancel, product }) => {
    if (!product) return null;

    // Tạo dữ liệu cho mã QR (chuỗi JSON chứa thông tin sản phẩm)
    const qrData = product.productCode

    // Hàm xử lý tải xuống mã QR
    const handleDownloadQR = () => {
        const canvas = document.getElementById('product-qr-code');
        if (canvas) {
            const pngUrl = canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream');
            const downloadLink = document.createElement('a');
            downloadLink.href = pngUrl;
            downloadLink.download = `QR_${product.productCode}.png`;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
        } else {
            message.error('Không tìm thấy mã QR để tải xuống.');
        }
    };

    // Hàm xử lý in mã QR
    const handlePrintQR = () => {
        const canvas = document.getElementById('product-qr-code');
        if (!canvas) {
            message.error('Không tìm thấy mã QR để in.');
            return;
        }

        // Trì hoãn in để đảm bảo canvas được render
        setTimeout(() => {
            window.print();
        }, 500); // Đợi 500ms
    };

    return (
        <Modal
            title="Chi tiết sản phẩm"
            open={visible}
            onCancel={onCancel}
            footer={null}
            destroyOnClose
            width={600}
        >
            <style>
                {`
                    @media print {
                        body * {
                            visibility: hidden;
                        }
                        .qr-section, .qr-section * {
                            visibility: visible !important;
                        }
                        .qr-section {
                            position: absolute;
                            top: 0;
                            left: 0;
                            width: 100%;
                            height: 100%;
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            justify-content: center;
                        }
                        #product-qr-code {
                            margin: 0 auto;
                            width: 200px !important;
                            height: 200px !important;
                        }
                        .ant-btn {
                            display: none !important;
                        }
                    }
                `}
            </style>
            <Descriptions bordered column={1} style={{ marginBottom: 24 }}>
                <Descriptions.Item label="Mã sản phẩm">{product.productCode}</Descriptions.Item>
                <Descriptions.Item label="Tên sản phẩm">{product.productName}</Descriptions.Item>
                <Descriptions.Item label="Số lượng tồn kho">{product.quantity}</Descriptions.Item>
                <Descriptions.Item label="Đơn vị tính">{product.unit}</Descriptions.Item>
                <Descriptions.Item label="Nhà cung cấp">{product.supplierName}</Descriptions.Item>
                <Descriptions.Item label="Vị trí lưu trữ">{product.locationName}</Descriptions.Item>
            </Descriptions>
            <div className="qr-section" style={{ textAlign: 'center' }}>
                <Typography.Title level={4} className="qr-title">Mã QR Sản Phẩm</Typography.Title>
                <QRCode
                    id="product-qr-code"
                    value={qrData}
                    size={200}
                    level="H"
                    includeMargin={true}
                />
                <div style={{ marginTop: 16 }}>
                    <Button type="primary" onClick={handleDownloadQR} style={{ marginRight: 8 }}>
                        Tải QR Code
                    </Button>
                    <Button type="default" onClick={handlePrintQR}>
                        In QR Code
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default ProductDetailModal;