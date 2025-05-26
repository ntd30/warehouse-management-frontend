import { Form, Input, Button, Select } from 'antd';

// Component tái sử dụng để hiển thị form thêm/sửa sản phẩm
const ProductForm = ({ form, onFinish, initialValues, loading }) => {
    const units = [
        { id: 'Cái', name: 'Cái' },
        { id: 'Quả', name: 'Quả' },
        { id: 'Hộp', name: 'Hộp' },
        { id: 'Thùng', name: 'Thùng' },
        { id: 'Kg', name: 'Kg' },
    ];

    return (
        <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            initialValues={initialValues}
        >
            {/* Tên sản phẩm */}
            <Form.Item
                name="name"
                label="Tên sản phẩm"
                rules={[{ required: true, message: 'Vui lòng nhập tên sản phẩm!' }]}
            >
                <Input placeholder="Nhập tên sản phẩm" />
            </Form.Item>

            {/* Mã sản phẩm */}
            <Form.Item
                name="productCode"
                label="Mã sản phẩm"
                hidden
            >
                <Input placeholder="Nhập mã sản phẩm" />
            </Form.Item>

            <Form.Item
                name="supplierId"
                label="SupplierId"
                hidden
            >
                <Input />
            </Form.Item>

            {/* Giá sản phẩm */}
            <Form.Item
                name="unit"
                label="Đơn vị tính"
                rules={[{ required: true, message: 'Vui lòng nhập đơn vị tính!' }]}
            >
                <Select placeholder="Chọn ĐVT" allowClear
                    options={units.map(u => ({ value: u.id, label: u.name }))}
                />
            </Form.Item>

            {/* Nút submit */}
            <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading} block>
                    {initialValues?.id ? 'Cập nhật' : 'Thêm mới'}
                </Button>
            </Form.Item>
        </Form>
    );
};

export default ProductForm;