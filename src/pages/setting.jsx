import { useState } from 'react'; // Bỏ useEffect nếu không dùng
import {
    Layout,
    Row,
    Col,
    Card,
    Form,
    Input,
    InputNumber,
    Button,
    Select,
    Table,
    Space,
    Typography,
    message,
    Divider,
    Tabs,
    Modal,
    Popconfirm,
    Checkbox,
    Tag,
    Tooltip,
} from 'antd';
import {
    UserOutlined,
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    SaveOutlined,
    BellOutlined,
    SafetyCertificateOutlined,
} from '@ant-design/icons';
// import moment from 'moment'; // Bỏ moment nếu không dùng trực tiếp trong file này nữa

const { Paragraph } = Typography; // Thêm Title, Text
// const { TabPane } = Tabs; // Xóa dòng này

// --- Dữ liệu mẫu ---
const initialPermissions = [
    { id: 'perm1', name: 'Xem Dashboard', description: 'Quyền xem trang tổng quan' },
    { id: 'perm2', name: 'Quản lý Nhập Kho', description: 'Quyền tạo và quản lý phiếu nhập' },
    { id: 'perm3', name: 'Quản lý Xuất Kho', description: 'Quyền tạo và quản lý phiếu xuất' },
    { id: 'perm4', name: 'Quản lý Kiểm Kê', description: 'Quyền thực hiện kiểm kê kho' },
    { id: 'perm5', name: 'Xem Báo Cáo', description: 'Quyền xem các loại báo cáo' },
    { id: 'perm6', name: 'Quản lý Người Dùng', description: 'Quyền thêm, sửa, xóa người dùng' },
    { id: 'perm7', name: 'Quản lý Vai Trò & Quyền Hạn', description: 'Quyền quản lý vai trò và gán quyền' },
    { id: 'perm8', name: 'Quản lý Quy Tắc Nghiệp Vụ', description: 'Quyền thiết lập quy tắc kho' },
];

const initialRoles = [
    { id: 'role_admin', name: 'Quản Trị Viên', description: 'Toàn quyền quản trị hệ thống', permissions: initialPermissions.map(p => p.id) },
    { id: 'role_staff', name: 'Nhân Viên Kho', description: 'Quyền thực hiện các nghiệp vụ kho cơ bản', permissions: ['perm1', 'perm2', 'perm3', 'perm4'] },
    { id: 'role_viewer', name: 'Người Xem', description: 'Chỉ có quyền xem thông tin', permissions: ['perm1', 'perm5'] },
];

const initialUsers = [
    { id: 'user1', username: 'admin', fullName: 'Quản Trị Viên Chính', email: 'admin@example.com', roleId: 'role_admin', isActive: true },
    { id: 'user2', username: 'nvkho01', fullName: 'Nhân Viên Kho A', email: 'nvkho01@example.com', roleId: 'role_staff', isActive: true },
    { id: 'user3', username: 'viewer01', fullName: 'Người Xem Báo Cáo', email: 'viewer01@example.com', roleId: 'role_viewer', isActive: false },
];

const mockProductsForMinStock = [
    { key: 'SP001', productCode: 'SP001', productName: 'Sản phẩm Alpha', currentMinStock: 10, unit: 'Cái' },
    { key: 'SP002', productCode: 'SP002', productName: 'Sản phẩm Beta', currentMinStock: 5, unit: 'Hộp' },
    { key: 'SP003', productCode: 'SP003', productName: 'Sản phẩm Gamma', currentMinStock: 20, unit: 'Thùng' },
];
// --- Kết thúc dữ liệu mẫu ---

const SettingsScreen = () => {
    // Permission State
    const [permissions, setPermissions] = useState(initialPermissions);
    const [isPermissionModalVisible, setIsPermissionModalVisible] = useState(false);
    const [editingPermission, setEditingPermission] = useState(null);
    const [permissionForm] = Form.useForm();

    // Role State
    const [roles, setRoles] = useState(initialRoles);
    const [isRoleModalVisible, setIsRoleModalVisible] = useState(false);
    const [editingRole, setEditingRole] = useState(null);
    const [roleForm] = Form.useForm();

    // User Management State
    const [users, setUsers] = useState(initialUsers);
    const [isUserModalVisible, setIsUserModalVisible] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [userForm] = Form.useForm();

    // Inventory Limit State
    const [productsMinStock, setProductsMinStock] = useState(
        mockProductsForMinStock.map(p => ({ ...p, newMinStock: p.currentMinStock }))
    );

    // Alert Settings State
    const [alertSettingsForm] = Form.useForm();
    const [alertRecipients, setAlertRecipients] = useState([initialUsers[0].email]);


    // Permission Functions
    const showPermissionModal = (permission = null) => {
        setEditingPermission(permission);
        permissionForm.setFieldsValue(permission || { name: '', description: '' }); // Đảm bảo reset nếu không có permission
        setIsPermissionModalVisible(true);
    };

    const handlePermissionModalOk = () => {
        permissionForm.validateFields().then(values => {
            if (editingPermission) {
                setPermissions(permissions.map(p => p.id === editingPermission.id ? { ...p, ...values } : p));
                message.success('Cập nhật quyền hạn thành công!');
            } else {
                const newPermission = { id: `perm${Date.now()}`, ...values };
                setPermissions([...permissions, newPermission]);
                message.success('Thêm quyền hạn thành công!');
            }
            setIsPermissionModalVisible(false);
            permissionForm.resetFields();
        }).catch(info => console.log('Validate Failed:', info));
    };

    const handleDeletePermission = (permissionId) => {
        const isUsed = roles.some(role => role.permissions.includes(permissionId));
        if (isUsed) {
            message.error('Không thể xóa quyền hạn này vì đang được gán cho một hoặc nhiều vai trò.');
            return;
        }
        setPermissions(permissions.filter(p => p.id !== permissionId));
        message.success('Xóa quyền hạn thành công!');
    };

    // Role Functions
    const showRoleModal = (role = null) => {
        setEditingRole(role);
        roleForm.setFieldsValue(role ? { ...role, permissions: role.permissions || [] } : { name: '', description: '', permissions: [] });
        setIsRoleModalVisible(true);
    };

    const handleRoleModalOk = () => {
        roleForm.validateFields().then(values => {
            if (editingRole) {
                setRoles(roles.map(r => r.id === editingRole.id ? { ...r, ...values } : r));
                message.success('Cập nhật vai trò thành công!');
            } else {
                const newRole = { id: `role_${values.name.toLowerCase().replace(/\s+/g, '_')}${Date.now()}`, ...values };
                setRoles([...roles, newRole]);
                message.success('Thêm vai trò thành công!');
            }
            setIsRoleModalVisible(false);
            roleForm.resetFields();
        }).catch(info => console.log('Validate Failed:', info));
    };

    const handleDeleteRole = (roleId) => {
        const isUsed = users.some(user => user.roleId === roleId);
        if (isUsed) {
            message.error('Không thể xóa vai trò này vì đang được gán cho một hoặc nhiều người dùng.');
            return;
        }
        setRoles(roles.filter(r => r.id !== roleId));
        message.success('Xóa vai trò thành công!');
    };


    // User Management Functions
    const showUserModal = (user = null) => {
        setEditingUser(user);
        userForm.setFieldsValue(user ? { ...user } : { username: '', fullName: '', email: '', roleId: undefined, isActive: true });
        setIsUserModalVisible(true);
    };

    const handleUserModalOk = () => {
        userForm.validateFields()
            .then(values => {
                if (editingUser) {
                    setUsers(users.map(u => u.id === editingUser.id ? { ...u, ...values } : u));
                    message.success('Cập nhật người dùng thành công!');
                } else {
                    const newUser = { id: `user${Date.now()}`, ...values };
                    setUsers([...users, newUser]);
                    message.success('Thêm người dùng thành công!');
                }
                setIsUserModalVisible(false);
                userForm.resetFields();
            })
            .catch(info => console.log('Validate Failed:', info));
    };

    const handleDeleteUser = (userId) => {
        setUsers(users.filter(u => u.id !== userId));
        message.success('Xóa người dùng thành công!');
    };


    // Inventory Limit Functions
    const handleMinStockChange = (value, productKey) => {
        setProductsMinStock(prev =>
            prev.map(p => (p.key === productKey ? { ...p, newMinStock: value === null ? 0 : value } : p))
        );
    };

    const handleUpdateMinStock = (productKey) => {
        const productToUpdate = productsMinStock.find(p => p.key === productKey);
        if (productToUpdate) {
            setProductsMinStock(prev =>
                prev.map(p => (p.key === productKey ? { ...p, currentMinStock: p.newMinStock } : p))
            );
            message.success(`Cập nhật mức tồn tối thiểu cho ${productToUpdate.productName} thành công!`);
        }
    };

    const handleSaveAllMinStockChanges = () => {
        const updatedList = productsMinStock.map(p => ({ ...p, currentMinStock: p.newMinStock }));
        setProductsMinStock(updatedList);
        message.success('Đã lưu tất cả thay đổi mức tồn kho tối thiểu!');
    }

    // Alert Settings Functions
    const onFinishAlertSettings = (values) => {
        setAlertRecipients(values.recipients);
        console.log('Lưu cài đặt cảnh báo:', values);
        message.success('Lưu cài đặt cảnh báo thành công!');
    };

    // Columns definitions
    const permissionColumns = [
        { title: 'ID Quyền Hạn', dataIndex: 'id', key: 'id', width: 150 },
        { title: 'Tên Quyền Hạn', dataIndex: 'name', key: 'name', width: 250, ellipsis: true },
        { title: 'Mô tả', dataIndex: 'description', key: 'description', ellipsis: true },
        {
            title: 'Thao Tác',
            key: 'action',
            width: 150,
            align: 'center',
            render: (_, record) => (
                <Space>
                    <Tooltip title="Sửa quyền hạn"><Button icon={<EditOutlined />} onClick={() => showPermissionModal(record)} /></Tooltip>
                    <Popconfirm title="Bạn chắc chắn muốn xóa quyền hạn này?" onConfirm={() => handleDeletePermission(record.id)} okText="Xóa" cancelText="Hủy">
                        <Tooltip title="Xóa quyền hạn"><Button icon={<DeleteOutlined />} danger /></Tooltip>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    const roleColumns = [
        { title: 'ID Vai Trò', dataIndex: 'id', key: 'id', width: 150 },
        { title: 'Tên Vai Trò', dataIndex: 'name', key: 'name', width: 200, ellipsis: true },
        { title: 'Mô tả', dataIndex: 'description', key: 'description', ellipsis: true },
        { title: 'Số Quyền Hạn', dataIndex: 'permissions', key: 'permissionsCount', width: 120, align: 'center', render: perms => perms?.length || 0 },
        {
            title: 'Thao Tác',
            key: 'action',
            width: 150,
            align: 'center',
            render: (_, record) => (
                <Space>
                    <Tooltip title="Sửa vai trò & gán quyền"><Button icon={<EditOutlined />} onClick={() => showRoleModal(record)} /></Tooltip>
                    <Popconfirm title="Bạn chắc chắn muốn xóa vai trò này?" onConfirm={() => handleDeleteRole(record.id)} okText="Xóa" cancelText="Hủy">
                        <Tooltip title="Xóa vai trò"><Button icon={<DeleteOutlined />} danger /></Tooltip>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    const userColumns = [
        { title: 'Tên đăng nhập', dataIndex: 'username', key: 'username', width: 150 },
        { title: 'Họ và Tên', dataIndex: 'fullName', key: 'fullName', width: 200, ellipsis: true },
        { title: 'Email', dataIndex: 'email', key: 'email', width: 200, ellipsis: true },
        { title: 'Vai trò', dataIndex: 'roleId', key: 'roleId', width: 180, render: roleId => roles.find(r => r.id === roleId)?.name || roleId },
        { title: 'Trạng thái', dataIndex: 'isActive', key: 'isActive', width: 100, render: isActive => isActive ? <Tag color="green">Hoạt động</Tag> : <Tag color="red">Khóa</Tag> },
        {
            title: 'Thao Tác',
            key: 'action',
            width: 150,
            align: 'center',
            render: (_, record) => (
                <Space>
                    <Tooltip title="Sửa người dùng"><Button icon={<EditOutlined />} onClick={() => showUserModal(record)} /></Tooltip>
                    <Popconfirm title="Bạn chắc chắn muốn xóa người dùng này?" onConfirm={() => handleDeleteUser(record.id)} okText="Xóa" cancelText="Hủy">
                        <Tooltip title="Xóa người dùng"><Button icon={<DeleteOutlined />} danger /></Tooltip>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    const minStockColumns = [
        { title: 'Mã Hàng', dataIndex: 'productCode', key: 'productCode', width: 120 },
        { title: 'Tên Hàng Hóa', dataIndex: 'productName', key: 'productName', width: 250, ellipsis: true },
        { title: 'ĐVT', dataIndex: 'unit', key: 'unit', width: 80 },
        { title: 'Mức Tồn Tối Thiểu Hiện Tại', dataIndex: 'currentMinStock', key: 'currentMinStock', align: 'right', width: 200 },
        {
            title: 'Mức Tồn Tối Thiểu Mới',
            dataIndex: 'newMinStock',
            key: 'newMinStock',
            width: 200,
            render: (text, record) => (
                <InputNumber
                    min={0}
                    value={record.newMinStock}
                    onChange={value => handleMinStockChange(value, record.key)}
                    style={{ width: '100px' }}
                />
            ),
        },
        {
            title: 'Thao Tác',
            key: 'action',
            width: 120,
            align: 'center',
            render: (_, record) => (
                <Button type="primary" onClick={() => handleUpdateMinStock(record.key)} icon={<SaveOutlined />}>
                    Cập nhật
                </Button>
            ),
        },
    ];

    // Tạo mảng items cho Tabs
    const settingTabItems = [
        {
            label: <Space><UserOutlined />Quản lý Người dùng & Phân quyền</Space>,
            key: 'users_permissions',
            children: (
                <>
                    <Row gutter={[16, 16]}>
                        <Col xs={24} lg={12}>
                            <Card title="Quản lý Quyền Hạn" bordered={false} style={{ borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.09)' }}
                                extra={<Button type="dashed" icon={<PlusOutlined />} onClick={() => showPermissionModal()}>Thêm Quyền Hạn</Button>}
                            >
                                <Table columns={permissionColumns} dataSource={permissions} rowKey="id" size="small" pagination={{ pageSize: 5 }} scroll={{ x: 'max-content' }} />
                            </Card>
                        </Col>
                        <Col xs={24} lg={12}>
                            <Card title="Quản lý Vai Trò" bordered={false} style={{ borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.09)' }}
                                extra={<Button type="dashed" icon={<PlusOutlined />} onClick={() => showRoleModal()}>Thêm Vai Trò</Button>}
                            >
                                <Table columns={roleColumns} dataSource={roles} rowKey="id" size="small" pagination={{ pageSize: 5 }} scroll={{ x: 'max-content' }} />
                            </Card>
                        </Col>
                    </Row>
                    <Divider />
                    <Card title="Quản lý Người Dùng" bordered={false} style={{ marginTop: 16, borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.09)' }}
                        extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => showUserModal()}>Thêm Người Dùng</Button>}
                    >
                        <Table
                            columns={userColumns}
                            dataSource={users}
                            rowKey="id"
                            bordered
                            size="small"
                            scroll={{ x: 'max-content' }}
                            pagination={{ pageSize: 10 }}
                        />
                    </Card>
                </>
            )
        },
        {
            label: <Space><SafetyCertificateOutlined />Thiết lập Quy tắc Nghiệp vụ</Space>,
            key: 'business_rules',
            children: (
                <>
                    <Card title="Giới Hạn Tồn Kho Tối Thiểu" bordered={false} style={{ marginBottom: 24, borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.09)' }}
                        extra={<Button type="dashed" icon={<SaveOutlined />} onClick={handleSaveAllMinStockChanges}>Lưu Tất Cả Thay Đổi</Button>}
                    >
                        <Table
                            columns={minStockColumns}
                            dataSource={productsMinStock}
                            rowKey="key"
                            bordered
                            size="small"
                            pagination={false}
                            scroll={{ x: 'max-content' }}
                        />
                    </Card>

                    <Card title="Cài Đặt Cảnh Báo Hết Hàng" bordered={false} style={{ borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.09)' }}>
                        <Paragraph>
                            Hệ thống sẽ tự động gửi cảnh báo khi số lượng tồn kho của một mặt hàng giảm xuống dưới mức tồn kho tối thiểu đã thiết lập.
                            Chọn người dùng sẽ nhận được các cảnh báo này qua email.
                        </Paragraph>
                        <Form form={alertSettingsForm} layout="vertical" onFinish={onFinishAlertSettings} initialValues={{ recipients: alertRecipients }}>
                            <Row gutter={16}>
                                <Col xs={24} md={16}>
                                    <Form.Item name="recipients" label="Người Nhận Cảnh Báo (Email)" rules={[{ required: true, message: 'Vui lòng chọn ít nhất một người nhận!' }]}>
                                        <Select
                                            mode="multiple"
                                            allowClear
                                            style={{ width: '100%' }}
                                            placeholder="Chọn email người nhận"
                                            options={users.filter(u => u.isActive && u.email).map(user => ({
                                                label: `${user.fullName} (${user.email})`,
                                                value: user.email,
                                            }))}
                                        />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={8}>
                                    <Form.Item label=" "> {/* For alignment */}
                                        <Button type="primary" htmlType="submit" icon={<BellOutlined />}>
                                            Lưu Cài Đặt Cảnh Báo
                                        </Button>
                                    </Form.Item>
                                </Col>
                            </Row>
                        </Form>
                    </Card>
                </>
            )
        }
    ];

    return (
        <>
            <Tabs
                defaultActiveKey="users_permissions"
                type="card"
                items={settingTabItems} // Sử dụng items thay cho TabPane
            />

            {/* Modal Thêm/Sửa Quyền Hạn */}
            <Modal
                title={editingPermission ? "Sửa Quyền Hạn" : "Thêm Quyền Hạn Mới"}
                open={isPermissionModalVisible} // Sửa lại tên biến cho đúng
                onOk={handlePermissionModalOk}
                onCancel={() => { setIsPermissionModalVisible(false); permissionForm.resetFields(); }}
                okText={editingPermission ? "Cập nhật" : "Thêm mới"}
                cancelText="Hủy"
                destroyOnClose
            >
                <Form form={permissionForm} layout="vertical">
                    <Form.Item name="name" label="Tên Quyền Hạn" rules={[{ required: true, message: 'Vui lòng nhập tên quyền hạn!' }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="description" label="Mô tả">
                        <Input.TextArea rows={2} />
                    </Form.Item>
                    {editingPermission && (
                        <Form.Item name="id" label="ID Quyền Hạn (Không thể sửa)">
                            <Input disabled />
                        </Form.Item>
                    )}
                </Form>
            </Modal>

            {/* Modal Thêm/Sửa Vai Trò */}
            <Modal
                title={editingRole ? "Sửa Vai Trò & Gán Quyền" : "Thêm Vai Trò Mới"}
                open={isRoleModalVisible} // Sửa lại tên biến cho đúng
                onOk={handleRoleModalOk}
                onCancel={() => { setIsRoleModalVisible(false); roleForm.resetFields(); }}
                okText={editingRole ? "Cập nhật" : "Thêm mới"}
                cancelText="Hủy"
                width={700}
                destroyOnClose
            >
                <Form form={roleForm} layout="vertical">
                    <Form.Item name="name" label="Tên Vai Trò" rules={[{ required: true, message: 'Vui lòng nhập tên vai trò!' }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="description" label="Mô tả">
                        <Input.TextArea rows={2} />
                    </Form.Item>
                    {editingRole && (
                        <Form.Item name="id" label="ID Vai Trò (Không thể sửa)">
                            <Input disabled />
                        </Form.Item>
                    )}
                    <Form.Item name="permissions" label="Gán Quyền Hạn Cho Vai Trò">
                        <Checkbox.Group style={{ width: '100%' }}>
                            <Row gutter={[8, 8]}>
                                {permissions.map(permission => (
                                    <Col span={12} key={permission.id}>
                                        <Checkbox value={permission.id}>{permission.name}</Checkbox>
                                    </Col>
                                ))}
                            </Row>
                        </Checkbox.Group>
                    </Form.Item>
                </Form>
            </Modal>

            {/* Modal Thêm/Sửa Người Dùng */}
            <Modal
                title={editingUser ? "Sửa Thông Tin Người Dùng" : "Thêm Người Dùng Mới"}
                open={isUserModalVisible} // Sửa lại tên biến cho đúng
                onOk={handleUserModalOk}
                onCancel={() => { setIsUserModalVisible(false); userForm.resetFields(); }}
                okText={editingUser ? "Cập nhật" : "Thêm mới"}
                cancelText="Hủy"
                destroyOnClose
            >
                <Form form={userForm} layout="vertical">
                    <Form.Item name="username" label="Tên đăng nhập" rules={[{ required: true, message: 'Vui lòng nhập tên đăng nhập!' }]}>
                        <Input disabled={!!editingUser} />
                    </Form.Item>
                    <Form.Item name="fullName" label="Họ và Tên" rules={[{ required: true, message: 'Vui lòng nhập họ tên!' }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="email" label="Email" rules={[{ required: true, message: 'Vui lòng nhập email!' }, { type: 'email', message: 'Email không hợp lệ!' }]}>
                        <Input />
                    </Form.Item>
                    {!editingUser && ( // Chỉ yêu cầu mật khẩu khi thêm mới
                        <Form.Item name="password" label="Mật khẩu" rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}>
                            <Input.Password />
                        </Form.Item>
                    )}
                    <Form.Item name="roleId" label="Vai trò" rules={[{ required: true, message: 'Vui lòng chọn vai trò!' }]}>
                        <Select options={roles.map(r => ({ value: r.id, label: r.name }))} placeholder="Chọn vai trò cho người dùng" />
                    </Form.Item>
                    <Form.Item name="isActive" label="Trạng thái" valuePropName="checked" initialValue={true}>
                        <Checkbox>Kích hoạt tài khoản</Checkbox>
                    </Form.Item>
                </Form>
            </Modal>
        </>
    );
};

export default SettingsScreen;
