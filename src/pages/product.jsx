import { useState, useEffect, useCallback } from 'react';
import {
    Table,
    Button,
    Card,
    Space,
    notification,
    Modal,
    Form,
    Popconfirm,
    Tooltip,
} from 'antd';
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    EyeOutlined,
} from '@ant-design/icons';
import ProductDetailModal from '../components/product/product.detail';
import ProductForm from '../components/product/product.form';
import { fetchProductById, fetchProductsPaginationAPI } from '../services/api.service';

// Component chính để quản lý sản phẩm
const ProductManagement = () => {
    // State để quản lý danh sách sản phẩm và phân trang
    const [products, setProducts] = useState([]);
    const [total, setTotal] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [loading, setLoading] = useState(false);

    // State để quản lý modal và form
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [formLoading, setFormLoading] = useState(false);
    const [form] = Form.useForm();

    // Hàm tải danh sách sản phẩm
    const loadProducts = useCallback(async (page, size) => {
        setLoading(true);
        const result = await fetchProductsPaginationAPI(page, size);
        setLoading(false);

        if (result.success) {
            setProducts(result.data.content || []);
            setTotal(result.data.total || 0);
        } else {
            notification.error({
                message: 'Lỗi',
                description: result.message,
            });
        }
    }, []);

    // Tải danh sách sản phẩm khi trang hoặc kích thước trang thay đổi
    useEffect(() => {
        loadProducts(currentPage, pageSize);
    }, [currentPage, pageSize, loadProducts]);

    // Hàm hiển thị modal thêm/sửa
    const showModal = (product = null) => {
        setEditingProduct(product);
        form.setFieldsValue(
            product || {
                name: '',
                productCode: '',
                price: 0,
                quantity: 0,
                status: 'ACTIVE',
            }
        );
        setIsModalVisible(true);
    };

    // Hàm xử lý khi submit form
    const handleFormSubmit = async (values) => {
        setFormLoading(true);
        let result;

        if (editingProduct) {
            // Cập nhật sản phẩm
            result = await updateProduct(editingProduct.id, values);
        } else {
            // Thêm sản phẩm mới
            result = await createProduct(values);
        }

        setFormLoading(false);

        if (result.success) {
            notification.success({
                message: editingProduct ? 'Cập nhật thành công' : 'Thêm thành công',
                description: `Sản phẩm ${values.name} đã được ${editingProduct ? 'cập nhật' : 'thêm'
                    } thành công!`,
            });
            setIsModalVisible(false);
            form.resetFields();
            loadProducts(currentPage, pageSize);
        } else {
            notification.error({
                message: 'Lỗi',
                description: result.message,
            });
        }
    };

    // Hàm xóa sản phẩm
    // const handleDelete = async (id) => {
    //     setLoading(true);
    //     const result = await deleteProduct(id);
    //     setLoading(false);

    //     if (result.success) {
    //         notification.success({
    //             message: 'Xóa thành công',
    //             description: 'Sản phẩm đã được xóa!',
    //         });
    //         loadProducts(currentPage, pageSize);
    //     } else {
    //         notification.error({
    //             message: 'Lỗi',
    //             description: result.message,
    //         });
    //     }
    // };

    // Hàm xem chi tiết sản phẩm
    const handleViewDetail = async (id) => {
        setLoading(true);
        const result = await fetchProductById(id);
        setLoading(false);

        if (result.success) {
            setSelectedProduct(result.data);
            setIsDetailModalVisible(true);
        } else {
            notification.error({
                message: 'Lỗi',
                description: result.message,
            });
        }
    };

    // Cấu hình cột cho bảng
    const columns = [
        {
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
            width: 80,
        },
        {
            title: 'Tên sản phẩm',
            dataIndex: 'name',
            key: 'name',
            ellipsis: true,
        },
        {
            title: 'Mã sản phẩm',
            dataIndex: 'productCode',
            key: 'productCode',
            width: 120,
        },
        {
            title: 'Giá (VND)',
            dataIndex: 'price',
            key: 'price',
            width: 120,
            render: (price) => price?.toLocaleString('vi-VN'),
        },
        {
            title: 'Số lượng',
            dataIndex: 'quantity',
            key: 'quantity',
            width: 100,
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            width: 100,
            render: (status) => (status === 'ACTIVE' ? 'Hoạt động' : 'Ngừng bán'),
        },
        {
            title: 'Thao tác',
            key: 'action',
            width: 150,
            align: 'center',
            render: (_, record) => (
                <Space>
                    <Tooltip title="Xem chi tiết">
                        <Button
                            icon={<EyeOutlined />}
                            onClick={() => handleViewDetail(record.id)}
                        />
                    </Tooltip>
                    <Tooltip title="Sửa sản phẩm">
                        <Button
                            icon={<EditOutlined />}
                            onClick={() => showModal(record)}
                        />
                    </Tooltip>
                    <Popconfirm
                        title="Bạn chắc chắn muốn xóa sản phẩm này?"
                        onConfirm={() => handleDelete(record.id)}
                        okText="Xóa"
                        cancelText="Hủy"
                    >
                        <Tooltip title="Xóa sản phẩm">
                            <Button icon={<DeleteOutlined />} danger />
                        </Tooltip>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div>
            <Card
                title="Quản lý Sản phẩm"
                bordered={false}
                style={{
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.09)',
                }}
                extra={
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => showModal()}
                    >
                        Thêm Sản phẩm
                    </Button>
                }
            >
                <Table
                    loading={loading}
                    columns={columns}
                    dataSource={products}
                    rowKey="id"
                    pagination={{
                        current: currentPage,
                        pageSize: pageSize,
                        total: total,
                        onChange: (page, size) => {
                            setCurrentPage(page);
                            setPageSize(size);
                        },
                    }}
                    scroll={{ x: 'max-content' }}
                />
            </Card>

            {/* Modal thêm/sửa sản phẩm */}
            <Modal
                title={editingProduct ? 'Sửa Sản phẩm' : 'Thêm Sản phẩm Mới'}
                open={isModalVisible}
                onCancel={() => {
                    setIsModalVisible(false);
                    form.resetFields();
                }}
                footer={null}
                destroyOnClose
            >
                <ProductForm
                    form={form}
                    onFinish={handleFormSubmit}
                    initialValues={editingProduct}
                    loading={formLoading}
                />
            </Modal>

            {/* Modal xem chi tiết sản phẩm */}
            <ProductDetailModal
                visible={isDetailModalVisible}
                onCancel={() => setIsDetailModalVisible(false)}
                product={selectedProduct}
            />
        </div>
    );
};

export default ProductManagement;