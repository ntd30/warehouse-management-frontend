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
                <Descriptions.Item label="ID">{product.id}</Descriptions.Item>
                <Descriptions.Item label="Tên sản phẩm">{product.name}</Descriptions.Item>
                <Descriptions.Item label="Mã sản phẩm">{product.productCode}</Descriptions.Item>
                <Descriptions.Item label="Giá (VND)">
                    {product.price?.toLocaleString('vi-VN')}
                </Descriptions.Item>
                <Descriptions.Item label="Số lượng tồn kho">{product.quantity}</Descriptions.Item>
                <Descriptions.Item label="Trạng thái">
                    {product.status === 'ACTIVE' ? 'Hoạt động' : 'Ngừng bán'}
                </Descriptions.Item>
                <Descriptions.Item label="Ngày tạo">
                    {new Date(product.createdAt).toLocaleString('vi-VN')}
                </Descriptions.Item>
                <Descriptions.Item label="Ngày cập nhật">
                    {product.updatedAt ? new Date(product.updatedAt).toLocaleString('vi-VN') : 'N/A'}
                </Descriptions.Item>
            </Descriptions>
        </Modal>
    );
};

export default ProductDetailModal;