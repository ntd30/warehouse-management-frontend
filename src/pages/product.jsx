import { useState, useEffect } from 'react';
import {
    Table,
    Button,
    Card,
    Space,
    notification,
    Modal,
    Form,
    Tooltip,
    message,
} from 'antd';
import {
    PlusOutlined,
    EditOutlined,
    EyeOutlined,
} from '@ant-design/icons';
import ProductDetailModal from '../components/product/product.detail';
import ProductForm from '../components/product/product.form';
import { fetchProductByCodeAPI, fetchProductsPaginationAPI, updateProductAPI } from '../services/api.service';

// Component chính để quản lý sản phẩm
const ProductManagement = () => {
    // State để quản lý danh sách sản phẩm và phân trang
    const [products, setProducts] = useState([]);
    const [total, setTotal] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(5);
    const [loading, setLoading] = useState(false);

    // State để quản lý modal và form
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [formLoading, setFormLoading] = useState(false);
    const [form] = Form.useForm();

    // Hàm tải danh sách sản phẩm
    const loadProducts = async (page, size) => {
        setLoading(true);
        const result = await fetchProductsPaginationAPI(page, size);

        if (result.data) {
            setProducts(result.data.content || []);
            setTotal(result.data.totalElements || 0);
        } else {
            notification.error({
                message: 'Lỗi',
                description: result.message,
            });
        }

        setLoading(false);
    };

    // Tải danh sách sản phẩm khi trang hoặc kích thước trang thay đổi
    useEffect(() => {
        loadProducts(currentPage, pageSize);
    }, [currentPage, pageSize]);

    // Hàm hiển thị modal thêm/sửa
    const showModal = (product = null) => {
        setEditingProduct(product);
        form.setFieldsValue(
            product || {
                name: '',
                productCode: '',
            }
        );
        setIsModalVisible(true);
    };

    // Hàm xử lý khi submit form
    const handleFormSubmit = async (values) => {
        setFormLoading(true);
        let result;
        try {
            if (editingProduct) {
                // Cập nhật sản phẩm
                result = await updateProductAPI(editingProduct.productCode, values);
            } else {
                // Thêm sản phẩm mới
                // result = await createProduct(values);
            }

            if (result.data) {
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
        } catch (error) {
            // notification.error({
            //     message: 'Lỗi',
            //     description: result.message,
            // });
            message.error("Lỗi hệ thống")
        } finally {
            setFormLoading(false);
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
    const handleViewDetail = async (code) => {
        setLoading(true);
        const result = await fetchProductByCodeAPI(code);

        if (result.data) {
            setSelectedProduct(result.data);
            setIsDetailModalVisible(true);
        } else {
            notification.error({
                message: 'Lỗi',
                description: result.message,
            });
        }

        setLoading(false);
    };

    // Cấu hình cột cho bảng
    const columns = [
        {
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
            width: 80,
            hidden: true,
        },
        {
            title: 'SupplierId',
            dataIndex: 'supplierId',
            key: 'supplierId',
            width: 80,
            hidden: true,
        },
        {
            title: 'Mã sản phẩm',
            dataIndex: 'productCode',
            key: 'productCode',
            width: 80,
        },
        {
            title: 'Tên sản phẩm',
            dataIndex: 'name',
            key: 'name',
            ellipsis: true,
            width: 250,
        },
        {
            title: 'Đơn vị tính',
            dataIndex: 'unit',
            key: 'unit',
            width: 120,
        },
        {
            title: 'Tồn kho hiện tại',
            dataIndex: 'inventory',
            key: 'inventory',
            width: 50,
        },
        {
            title: 'Tồn kho tối thiểu',
            dataIndex: 'minStock',
            key: 'minStock',
            width: 50,
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
                            onClick={() => handleViewDetail(record.productCode)}
                        />
                    </Tooltip>
                    <Tooltip title="Sửa sản phẩm">
                        <Button
                            icon={<EditOutlined />}
                            onClick={() => showModal(record)}
                        />
                    </Tooltip>
                    {/* <Popconfirm
                        title="Bạn chắc chắn muốn xóa sản phẩm này?"
                        onConfirm={() => handleDelete(record.id)}
                        okText="Xóa"
                        cancelText="Hủy"
                    >
                        <Tooltip title="Xóa sản phẩm">
                            <Button icon={<DeleteOutlined />} danger />
                        </Tooltip>
                    </Popconfirm> */}
                </Space>
            ),
        },
    ];

    const onChange = (pagination) => {
        if (+pagination.current !== +currentPage) {
            setCurrentPage(+pagination.current);
        }
        if (+pagination.pageSize !== +pageSize) {
            setPageSize(+pagination.pageSize);
        }
    };

    return (
        <div>
            <Card
                title="Quản lý Sản phẩm"
                bordered={false}
                style={{
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.09)',
                }}
            // extra={
            //     <Button
            //         type="primary"
            //         icon={<PlusOutlined />}
            //         onClick={() => showModal()}
            //     >
            //         Thêm Sản phẩm
            //     </Button>
            // }
            >
                <Table
                    loading={loading}
                    columns={columns}
                    dataSource={products}
                    rowKey="id"
                    onChange={onChange}
                    pagination={{
                        current: currentPage,
                        pageSize: pageSize,
                        showSizeChanger: true,
                        total: total,
                        showTotal: (total, range) => (
                            <div>
                                {range[0]}-{range[1]} trên {total} rows
                            </div>
                        ),
                    }}
                // scroll={{ x: 'max-content' }}
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