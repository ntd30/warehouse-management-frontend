import { Modal, Descriptions } from 'antd';

// Modal hiển thị chi tiết sản phẩm
const ProductDetailModal = ({ visible, onCancel, product }) => {
    if (!product) return null;

    return (
        <Modal
            title="Chi tiết sản phẩm"
            open={visible}
            onCancel={onCancel}
            footer={null}
            destroyOnClose
        >
            <Descriptions bordered column={1}>
                <Descriptions.Item label="Mã sản phẩm">{product.productCode}</Descriptions.Item>
                <Descriptions.Item label="Tên sản phẩm">{product.productName}</Descriptions.Item>
                <Descriptions.Item label="Số lượng tồn kho">{product.quantity}</Descriptions.Item>
                <Descriptions.Item label="Đơn vị tính">{product.unit}</Descriptions.Item>
                <Descriptions.Item label="Nhà cung cấp">{product.supplierName}</Descriptions.Item>
                <Descriptions.Item label="Vị trí lưu trữ">{product.locationName}</Descriptions.Item>
            </Descriptions>
        </Modal>
    );
};

export default ProductDetailModal;