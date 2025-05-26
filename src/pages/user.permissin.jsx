import { useState, useEffect } from 'react';
import {
    Row,
    Col,
    Card,
    Form,
    Input,
    Button,
    Table,
    Space,
    message,
    Modal,
    Popconfirm,
    Checkbox,
    Tooltip,
    Select,
    Divider,
    Tag,
    notification,
} from 'antd';
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
} from '@ant-design/icons';
import { createUpdateRoleAPI, deleteRoleAPI, fetchAllPermissionsAPI, fetchAllRolesAPI, fetchAllUsersAPI, ganNhieuQuyenChoVaiTro } from '../services/api.service';

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
// --- Kết thúc dữ liệu mẫu ---

const UserPermissionScreen = () => {
    const [loadingTable, setLoadingTable] = useState(false);
    const [loadingBtn, setLoadingBtn] = useState(false);

    // Permission State
    const [permissions, setPermissions] = useState(initialPermissions);
    // const [isPermissionModalVisible, setIsPermissionModalVisible] = useState(false);
    // const [editingPermission, setEditingPermission] = useState(null);
    // const [permissionForm] = Form.useForm();

    // Role State
    const [roles, setRoles] = useState([]);
    const [currentRole, setCurrentRole] = useState(1);
    const [pageSizeRole, setPageSizeRole] = useState(5);
    const [totalRole, setTotalRole] = useState(0);
    const [isRoleModalVisible, setIsRoleModalVisible] = useState(false);
    const [editingRole, setEditingRole] = useState(null);
    const [roleForm] = Form.useForm();

    // User Management State
    const [users, setUsers] = useState(initialUsers);
    const [currentUser, setCurrentUser] = useState(1);
    const [pageSizeUser, setPageSizeUser] = useState(5);
    const [totalUser, setTotalUser] = useState(0);
    const [isUserModalVisible, setIsUserModalVisible] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [userForm] = Form.useForm();

    // Use effect
    useEffect(() => {
        loadPermissions();
    }, []);
    useEffect(() => {
        loadRoles();
    }, [currentRole, pageSizeRole]);
    // useEffect(() => {
    //     loadUsers();
    // }, [currentUser, pageSizeUser]);

    // Permission Functions
    const loadPermissions = async () => {
        setLoadingTable(true);
        try {
            const res = await fetchAllPermissionsAPI(1, 200); // Lấy tất cả permissions với pageSize lớn
            if (res?.data?.content && Array.isArray(res.data.content)) {
                setPermissions(res.data.content);
            } else {
                setPermissions([]);
                notification.error({
                    message: "Lỗi tải danh sách Quyền hạn",
                    description: `Dữ liệu quyền hạn không hợp lệ: ${JSON.stringify(res?.data)}`,
                });
            }
        } catch (error) {
            setPermissions([]);
            notification.error({
                message: "Lỗi tải danh sách Quyền hạn",
                description: error.response?.data?.message || error.message || "Đã xảy ra lỗi khi tải dữ liệu",
            });
        } finally {
            setLoadingTable(false);
        }
    };

    // const showPermissionModal = (permission = null) => {
    //     setEditingPermission(permission);
    //     permissionForm.setFieldsValue(permission || { name: '', description: '' });
    //     setIsPermissionModalVisible(true);
    // };

    // Role Functions
    const loadRoles = async () => {
        setLoadingTable(true);
        try {
            const res = await fetchAllRolesAPI(currentRole, pageSizeRole); // Lấy tất cả roles với pageSize lớn
            if (res?.data?.content && Array.isArray(res.data.content)) {
                setRoles(res.data.content);
            } else {
                setRoles([]);
                notification.error({
                    message: "Lỗi tải danh sách Vai Trò",
                    description: `Dữ liệu vai trò không hợp lệ: ${JSON.stringify(res?.data)}`,
                });
            }
        } catch (error) {
            setRoles([]);
            notification.error({
                message: "Lỗi tải danh sách Vai Trò",
                description: error.response?.data?.message || error.message || "Đã xảy ra lỗi khi tải dữ liệu",
            });
        } finally {
            setLoadingTable(false);
        }
    };

    const showRoleModal = (role = null) => {
        setEditingRole(role);
        roleForm.setFieldsValue(role ? { ...role, permissions: role.permissions || [] } : { name: '', description: '', permissions: [] });
        setIsRoleModalVisible(true);
    };

    const handleRoleModalOk = async (values) => {
        try {
            setLoadingBtn(true); // Giả định setLoadingBtn đã được định nghĩa trong state

            const { name, description, permissions } = values;
            const roleData = { name, description, permissions };

            if (editingRole) {
                setRoles(roles.map(r => r.id === editingRole.id ? { ...r, ...values } : r));
                message.success('Cập nhật vai trò thành công!');
            } else {
                // Thêm mới vai trò
                const res = await createUpdateRoleAPI(null, roleData);

                if (!res.data) {
                    notification.error({
                        message: 'Lỗi Thêm Vai Trò',
                        description: JSON.stringify(res.message) || 'Đã xảy ra lỗi khi thêm vai trò',
                    });
                    return;
                }

                const id = res.data.id;
                const resAssignPermissions = await ganNhieuQuyenChoVaiTro(id, permissions);

                if (!resAssignPermissions) {
                    notification.error({
                        message: "Lỗi thêm mới Vai trò",
                        description: JSON.stringify(resAssignPermissions)
                    })
                    return;
                }

                await loadRoles();
                notification.success({
                    message: "Thêm Vai trò",
                    description: "Thêm Vai trò mới thành công"
                })
            }
            setIsRoleModalVisible(false);
            roleForm.resetFields();
        } catch (error) {
            notification.error({
                message: 'Lỗi Hệ Thống',
                description: error.response?.data?.message || error.message || 'Đã xảy ra lỗi khi xử lý yêu cầu',
            });
        } finally {
            setLoadingBtn(false); // Tắt loading sau khi hoàn thành
        }
    };

    const handleDeleteRole = async (idDelete) => {
        try {
            const res = await deleteRoleAPI(idDelete);
            if (res) {
                notification.success({
                    message: "Xóa Vai trò",
                    description: "Xóa Vai trò thành công!",
                });
                await loadRoles();
            } else {
                throw new Error("Xóa Vai trò thất bại!");
            }
        } catch (error) {
            notification.error({
                message: "Lỗi khi xóa Vai trò",
                description: error.message || "Xóa Vai trò thất bại!",
            });
        }
    };

    // User Management Functions
    const loadUsers = async () => {
        setLoadingTable(true);
        try {
            const res = await fetchAllUsersAPI(currentUser, pageSizeUser);
            if (res?.data?.content && Array.isArray(res.data.content)) {
                setUsers(res.data.content);
            } else {
                setUsers([]);
                notification.error({
                    message: "Lỗi tải danh sách Người dùng",
                    description: `Dữ liệu Người dùng không hợp lệ: ${JSON.stringify(res?.data)}`,
                });
            }
        } catch (error) {
            setUsers([]);
            notification.error({
                message: "Lỗi tải danh sách Người dùng",
                description: error.response?.data?.message || error.message || "Đã xảy ra lỗi khi tải dữ liệu",
            });
        } finally {
            setLoadingTable(false);
        }
    };

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

    // Columns definitions
    const roleColumns = [
        { title: 'ID Vai Trò', dataIndex: 'id', key: 'id', width: 150 },
        { title: 'Tên Vai Trò', dataIndex: 'name', key: 'name', width: 200, ellipsis: true },
        { title: 'Mô tả', dataIndex: 'description', key: 'description', ellipsis: true },
        { title: 'Số Quyền Hạn', dataIndex: 'permissions', key: 'permissionsCount', width: 120, align: 'center', render: () => permissions?.length || 0 },
        {
            title: 'Thao Tác',
            key: 'action',
            width: 150,
            align: 'center',
            render: (_, record) => (
                <Space>
                    <Tooltip title="Sửa vai trò"><Button icon={<EditOutlined />} onClick={() => showRoleModal(record)} /></Tooltip>
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

    return (
        <div>
            <Row gutter={[16, 16]}>
                <Col xs={24}>
                    <Card title="Quản lý Vai Trò" bordered={false} style={{ borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.09)' }}
                        extra={<Button type="dashed" icon={<PlusOutlined />} onClick={() => showRoleModal()}>Thêm Vai Trò</Button>}
                    >
                        <Table loading={loadingTable} columns={roleColumns} dataSource={roles} rowKey="id" size="small" pagination={{ pageSize: 5 }} scroll={{ x: 'max-content' }} />
                    </Card>
                </Col>
            </Row>
            <Divider />
            <Card title="Quản lý Người Dùng" bordered={false} style={{ marginTop: 16, borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.09)' }}
                extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => showUserModal()}>Thêm Người Dùng</Button>}
            >
                <Table
                    loading={loadingTable}
                    columns={userColumns}
                    dataSource={users}
                    rowKey="id"
                    bordered
                    size="small"
                    scroll={{ x: 'max-content' }}
                    pagination={{ pageSize: 10 }}
                />
            </Card>

            {/* Modal Thêm/Sửa Vai Trò */}
            <Modal
                title={editingRole ? "Sửa Vai Trò" : "Thêm Vai Trò Mới"}
                open={isRoleModalVisible}
                onOk={() => roleForm.submit()}
                onCancel={() => { setIsRoleModalVisible(false); roleForm.resetFields(); }}
                okText={editingRole ? "Cập nhật" : "Thêm mới"}
                cancelText="Hủy"
                width={700}
                destroyOnClose
            >
                <Form form={roleForm} layout="vertical" onFinish={handleRoleModalOk}>
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
                open={isUserModalVisible}
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
                    {!editingUser && (
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
        </div>
    );
};

export default UserPermissionScreen;