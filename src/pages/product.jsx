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
    Input,
} from 'antd';
import {
    PlusOutlined,
    EditOutlined,
    EyeOutlined,
    SearchOutlined,
} from '@ant-design/icons';
import ProductDetailModal from '../components/product/product.detail';
import ProductForm from '../components/product/product.form';
import { fetchProductByCodeAPI, fetchProductsPaginationAPI, updateProductAPI } from '../services/api.service';

// Component chính để quản lý sản phẩm
const ProductManagement = () => {
    // State để quản lý danh sách sản phẩm
    const [allProducts, setAllProducts] = useState([]); // Lưu toàn bộ sản phẩm
    const [filteredProducts, setFilteredProducts] = useState([]); // Danh sách sản phẩm sau khi lọc
    const [displayedProducts, setDisplayedProducts] = useState([]); // Danh sách hiển thị trên trang hiện tại
    const [total, setTotal] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(5);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState(''); // State cho giá trị tìm kiếm

    // State để quản lý modal và form
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [formLoading, setFormLoading] = useState(false);
    const [form] = Form.useForm();

    // Hàm tải toàn bộ sản phẩm
    const loadAllProducts = async () => {
        setLoading(true);
        try {
            let allData = [];
            let current = 1;
            let totalPages = 1;

            // Lặp qua các trang để lấy tất cả sản phẩm
            while (current <= totalPages) {
                const result = await fetchProductsPaginationAPI(current, pageSize);
                if (result.data) {
                    allData = [...allData, ...(result.data.content || [])];
                    totalPages = result.data.totalPages || 1;
                    setTotal(result.data.totalElements || 0);
                } else {
                    notification.error({
                        message: 'Lỗi',
                        description: result.message,
                    });
                    break;
                }
                current++;
            }

            setAllProducts(allData);
            setFilteredProducts(allData); // Khởi tạo danh sách lọc
            setDisplayedProducts(allData.slice(0, pageSize)); // Hiển thị trang đầu tiên
        } catch (error) {
            notification.error({
                message: 'Lỗi',
                description: 'Không thể tải danh sách sản phẩm.',
            });
        } finally {
            setLoading(false);
        }
    };

    // Tải danh sách sản phẩm khi component mount
    useEffect(() => {
        loadAllProducts();
    }, []);

    // Cập nhật sản phẩm hiển thị khi thay đổi trang hoặc kích thước trang
    useEffect(() => {
        const start = (currentPage - 1) * pageSize;
        const end = start + pageSize;
        setDisplayedProducts(filteredProducts.slice(start, end));
    }, [currentPage, pageSize, filteredProducts]);

    // Hàm xử lý tìm kiếm
    const handleSearch = (value) => {
        setSearchText(value);
        const filtered = allProducts.filter(
            (product) =>
                product.productCode.toLowerCase().includes(value.toLowerCase()) ||
                product.name.toLowerCase().includes(value.toLowerCase())
        );
        setFilteredProducts(filtered);
        setCurrentPage(1); // Reset về trang 1 khi tìm kiếm
        setDisplayedProducts(filtered.slice(0, pageSize)); // Hiển thị trang đầu tiên của kết quả lọc
    };

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
                    description: `Sản phẩm ${values.name} đã được ${editingProduct ? 'cập nhật' : 'thêm'} thành công!`,
                });
                setIsModalVisible(false);
                form.resetFields();
                loadAllProducts(); // Tải lại toàn bộ sản phẩm sau khi cập nhật
            } else {
                notification.error({
                    message: 'Lỗi',
                    description: result.message,
                });
            }
        } catch (error) {
            message.error("Lỗi hệ thống");
        } finally {
            setFormLoading(false);
        }
    };

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
            >
                <Space style={{ marginBottom: 16 }}>
                    <Input
                        placeholder="Tìm kiếm theo mã hoặc tên sản phẩm"
                        prefix={<SearchOutlined />}
                        value={searchText}
                        onChange={(e) => handleSearch(e.target.value)}
                        style={{ width: 300 }}
                    />
                    {/* <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => showModal()}
                    >
                        Thêm Sản phẩm
                    </Button> */}
                </Space>
                <Table
                    loading={loading}
                    columns={columns}
                    dataSource={displayedProducts} // Sử dụng danh sách hiển thị
                    rowKey="id"
                    onChange={onChange}
                    pagination={{
                        current: currentPage,
                        pageSize: pageSize,
                        showSizeChanger: true,
                        total: filteredProducts.length, // Tổng số bản ghi dựa trên danh sách lọc
                        showTotal: (total, range) => (
                            <div>
                                {range[0]}-{range[1]} trên {total} rows
                            </div>
                        ),
                    }}
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