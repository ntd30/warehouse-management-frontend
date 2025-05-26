import { Form, Input, InputNumber, Button, Select } from 'antd';

// Component tái sử dụng để hiển thị form thêm/sửa sản phẩm
const ProductForm = ({ form, onFinish, initialValues, loading }) => {
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
                rules={[{ required: true, message: 'Vui lòng nhập mã sản phẩm!' }]}
            >
                <Input placeholder="Nhập mã sản phẩm" />
            </Form.Item>

            {/* Giá sản phẩm */}
            <Form.Item
                name="price"
                label="Giá (VND)"
                rules={[{ required: true, message: 'Vui lòng nhập giá sản phẩm!' }]}
            >
                <InputNumber
                    min={0}
                    style={{ width: '100%' }}
                    formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
                />
            </Form.Item>

            {/* Số lượng tồn kho */}
            <Form.Item
                name="quantity"
                label="Số lượng tồn kho"
                rules={[{ required: true, message: 'Vui lòng nhập số lượng tồn kho!' }]}
            >
                <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>

            {/* Trạng thái */}
            <Form.Item
                name="status"
                label="Trạng thái"
                rules={[{ required: true, message: 'Vui lòng chọn trạng thái!' }]}
            >
                <Select placeholder="Chọn trạng thái">
                    <Select.Option value="ACTIVE">Hoạt động</Select.Option>
                    <Select.Option value="INACTIVE">Ngừng bán</Select.Option>
                </Select>
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