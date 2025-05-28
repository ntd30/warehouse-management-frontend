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
    Collapse,
} from 'antd';
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
} from '@ant-design/icons';
import { createUpdateRoleAPI, createUserAPI, deleteRoleAPI, deleteUserAPI, fetchAllPermissionsAPI, fetchAllRolesAPI, fetchAllUsersAPI, ganNhieuQuyenChoVaiTro, goNhieuQuyenChoVaiTro, updateUserAPI } from '../services/api.service';

const { Panel } = Collapse;

const UserPermissionScreen = () => {
    const [loadingTable, setLoadingTable] = useState(false);
    const [loadingBtn, setLoadingBtn] = useState(false);

    // Permission State
    const [permissions, setPermissions] = useState([]);
    // Role State
    const [roles, setRoles] = useState([]);
    const [currentRole, setCurrentRole] = useState(1);
    const [pageSizeRole, setPageSizeRole] = useState(5);
    const [totalRole, setTotalRole] = useState(0);
    const [isRoleModalVisible, setIsRoleModalVisible] = useState(false);
    const [editingRole, setEditingRole] = useState(null);
    const [roleForm] = Form.useForm();

    // User Management State
    const [users, setUsers] = useState([]);
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
    useEffect(() => {
        loadUsers();
    }, [currentUser, pageSizeUser]);

    const onChangeUser = (pagination) => {
        if (+pagination.current !== +currentUser) {
            setCurrentUser(+pagination.current);
        }
        if (+pagination.pageSize !== +pageSizeUser) {
            setPageSizeUser(+pagination.pageSize);
        }
    };

    const onChangeRole = (pagination) => {
        if (+pagination.current !== +currentRole) {
            setCurrentRole(+pagination.current);
        }
        if (+pagination.pageSize !== +pageSizeRole) {
            setPageSizeRole(+pagination.pageSize);
        }
    };

    // Permission Functions
    const loadPermissions = async () => {
        setLoadingTable(true);
        try {
            const res = await fetchAllPermissionsAPI(1, 200);
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

    // Nhóm permissions theo module và lọc các module không mong muốn
    const excludedModules = ['NGƯỜI DÙNG', 'VAI TRÒ', 'QUYỀN HẠN', 'QR_CODE'];
    const groupedPermissions = permissions.reduce((acc, perm) => {
        const module = perm.module?.toUpperCase() || 'OTHER';
        // Chỉ thêm vào accumulator nếu module không nằm trong danh sách loại trừ
        if (!excludedModules.includes(module)) {
            if (!acc[module]) {
                acc[module] = [];
            }
            acc[module].push(perm);
        }
        return acc;
    }, {});

    // Role Functions
    const loadRoles = async () => {
        setLoadingTable(true);
        try {
            const res = await fetchAllRolesAPI(currentRole, pageSizeRole);
            if (res?.data?.content && Array.isArray(res.data.content)) {
                setRoles(res.data.content);
                setTotalRole(res.data.totalElements);
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
        const formattedPermissions = role?.permissions
            ? (Array.isArray(role.permissions) && typeof role.permissions[0] === 'object'
                ? role.permissions.map(perm => perm.id)
                : role.permissions)
            : [];
        roleForm.setFieldsValue({
            ...role,
            permissions: formattedPermissions,
        });
        setIsRoleModalVisible(true);
    };

    const handleRoleModalOk = async (values) => {
        try {
            setLoadingBtn(true);

            const { name, description, permissions } = values;
            const roleData = { name, description };

            if (editingRole) {
                // Cập nhật vai trò
                const res = await createUpdateRoleAPI(editingRole.id, roleData);
                if (!res.data) {
                    notification.error({
                        message: 'Lỗi Cập nhật Vai Trò',
                        description: JSON.stringify(res.message) || 'Đã xảy ra lỗi khi cập nhật vai trò',
                    });
                    return;
                }

                // Lấy quyền hiện tại của vai trò
                const currentPermissions = editingRole.permissions || [];
                const formattedCurrentPermissions = Array.isArray(currentPermissions) && typeof currentPermissions[0] === 'object'
                    ? currentPermissions.map(perm => perm.id)
                    : currentPermissions;

                // Tính toán quyền cần gán và gỡ
                const permissionsToAssign = permissions.filter(id => !formattedCurrentPermissions.includes(id));
                const permissionsToRevoke = formattedCurrentPermissions.filter(id => !permissions.includes(id));

                // Gán quyền mới
                if (permissionsToAssign.length > 0) {
                    const resAssign = await ganNhieuQuyenChoVaiTro(editingRole.id, permissionsToAssign);
                    if (!resAssign) {
                        notification.error({
                            message: "Lỗi gán quyền cho Vai trò",
                            description: JSON.stringify(resAssign),
                        });
                        return;
                    }
                }

                // Gỡ quyền không còn được chọn
                if (permissionsToRevoke.length > 0) {
                    const resRevoke = await goNhieuQuyenChoVaiTro(editingRole.id, permissionsToRevoke);
                    if (!resRevoke) {
                        notification.error({
                            message: "Lỗi gỡ quyền cho Vai trò",
                            description: JSON.stringify(resRevoke),
                        });
                        return;
                    }
                }

                await loadRoles();
                notification.success({
                    message: "Cập nhật Vai trò",
                    description: "Cập nhật Vai trò thành công",
                });
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
                        description: JSON.stringify(resAssignPermissions),
                    });
                    return;
                }

                await loadRoles();
                notification.success({
                    message: "Thêm Vai trò",
                    description: "Thêm Vai trò mới thành công",
                });
            }
            setIsRoleModalVisible(false);
            roleForm.resetFields();
        } catch (error) {
            notification.error({
                message: 'Lỗi Hệ Thống',
                description: error.response?.data?.message || error.message || 'Đã xảy ra lỗi khi xử lý yêu cầu',
            });
        } finally {
            setLoadingBtn(false);
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
                setTotalUser(res.data.totalElements);
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
        userForm.setFieldsValue(user ? { ...user, isActive: user?.active } : { username: '', fullName: '', email: '', roleId: undefined, isActive: true });
        setIsUserModalVisible(true);
    };

    const handleUserModalOk = async (values) => {
        try {
            setLoadingBtn(true);

            const { id, username, email, password, fullName, isActive, roleId } = values;

            if (editingUser) {
                const resUpdateUser = await updateUserAPI(id, fullName, isActive, roleId);

                if (resUpdateUser.data) {
                    await loadUsers();
                    setIsUserModalVisible(false);
                    userForm.resetFields();
                    notification.success({
                        message: "Cập nhật người dùng",
                        description: "Cập nhật người dùng mới thành công",
                    });
                } else {
                    notification.error({
                        message: "Lỗi Cập nhật mới người dùng",
                        description: JSON.stringify(resUpdateUser),
                    });
                }
            } else {
                const resCreateUser = await createUserAPI(username, email, password, fullName, isActive, roleId);

                if (resCreateUser.data) {
                    await loadUsers();
                    setIsUserModalVisible(false);
                    userForm.resetFields();
                    notification.success({
                        message: "Thêm người dùng",
                        description: "Thêm người dùng mới thành công",
                    });
                } else {
                    notification.error({
                        message: "Lỗi thêm mới người dùng",
                        description: JSON.stringify(resCreateUser),
                    });
                }
            }
        } catch (error) {
            notification.error({
                message: 'Lỗi Hệ Thống',
                description: error.response?.data?.message || error.message || 'Đã xảy ra lỗi khi xử lý yêu cầu',
            });
        } finally {
            setLoadingBtn(false);
        }
    };

    const handleDeleteUser = async (idDelete) => {
        const res = await deleteUserAPI(idDelete);
        if (res.data) {
            notification.success({
                message: "Xóa người dùng",
                description: "Xóa người dùng thành công!",
            });
            await loadUsers();
        } else {
            notification.error({
                message: "Lỗi khi xóa người dùng",
                description: JSON.stringify(res.message),
            });
        }
    };

    // Columns definitions
    const roleColumns = [
        { title: 'ID Vai Trò', dataIndex: 'id', key: 'id', width: 150, hidden: true },
        { title: 'Tên Vai Trò', dataIndex: 'name', key: 'name', width: 200, ellipsis: true },
        { title: 'Mô tả', dataIndex: 'description', key: 'description', ellipsis: true },
        // { title: 'Số Quyền Hạn', dataIndex: 'permissions', key: 'permissionsCount', width: 120, align: 'center', render: (record) => record?.length || 0 },
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
        { title: 'Vai trò', dataIndex: 'roleName', key: 'roleName', width: 180 },
        { title: 'Trạng thái', dataIndex: 'active', key: 'active', width: 100, render: active => active ? <Tag color="green">Hoạt động</Tag> : <Tag color="red">Khóa</Tag> },
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
                        <Table
                            loading={loadingTable} columns={roleColumns} dataSource={roles}
                            rowKey="id" size="small" scroll={{ x: 'max-content' }}
                            onChange={onChangeRole}
                            pagination={{
                                current: currentRole,
                                pageSize: pageSizeRole,
                                showSizeChanger: true,
                                total: totalRole,
                                showTotal: (total, range) => (
                                    <div>
                                        {range[0]}-{range[1]} trên {total} rows
                                    </div>
                                ),
                            }}
                        />
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
                    onChange={onChangeUser}
                    pagination={{
                        current: currentUser,
                        pageSize: pageSizeUser,
                        showSizeChanger: true,
                        total: totalUser,
                        showTotal: (total, range) => (
                            <div>
                                {range[0]}-{range[1]} trên {total} rows
                            </div>
                        ),
                    }}
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
                okButtonProps={{ loading: loadingBtn }}
            >
                <Form form={roleForm} layout="vertical" onFinish={handleRoleModalOk}>
                    <Form.Item name="name" label="Tên Vai Trò" rules={[{ required: true, message: 'Vui lòng nhập tên vai trò!' }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="description" label="Mô tả">
                        <Input.TextArea rows={2} />
                    </Form.Item>
                    {editingRole && (
                        <Form.Item name="id" label="ID Vai Trò (Không thể sửa)" hidden>
                            <Input disabled />
                        </Form.Item>
                    )}
                    <Form.Item name="permissions" label="Gán Quyền Hạn Cho Vai Trò">
                        <Checkbox.Group style={{ width: '100%' }}>
                            <Collapse accordion style={{ width: '100%' }}>
                                {Object.keys(groupedPermissions).map(module => (
                                    <Panel header={module} key={module}>
                                        <Row gutter={[8, 8]}>
                                            {groupedPermissions[module].map(permission => (
                                                <Col span={12} key={permission.id}>
                                                    <Checkbox value={permission.id}>{permission.name}</Checkbox>
                                                </Col>
                                            ))}
                                        </Row>
                                    </Panel>
                                ))}
                            </Collapse>
                        </Checkbox.Group>
                    </Form.Item>
                </Form>
            </Modal>

            {/* Modal Thêm/Sửa Người Dùng */}
            <Modal
                title={editingUser ? "Sửa Thông Tin Người Dùng" : "Thêm Người Dùng Mới"}
                open={isUserModalVisible}
                onOk={() => userForm.submit()}
                onCancel={() => { setIsUserModalVisible(false); userForm.resetFields(); }}
                okText={editingUser ? "Cập nhật" : "Thêm mới"}
                cancelText="Hủy"
                destroyOnClose
                okButtonProps={{ loading: loadingBtn }}
            >
                <Form form={userForm} layout="vertical" onFinish={handleUserModalOk}>
                    <Form.Item name="id" label="Id" hidden>
                        <Input />
                    </Form.Item>
                    <Form.Item name="username" label="Tên đăng nhập" rules={[{ required: true, message: 'Vui lòng nhập tên đăng nhập!' }]}>
                        <Input disabled={!!editingUser} />
                    </Form.Item>
                    <Form.Item name="email" label="Email" rules={[{ required: true, message: 'Vui lòng nhập email!' }, { type: 'email', message: 'Email không hợp lệ!' }]}>
                        <Input disabled={!!editingUser} />
                    </Form.Item>
                    <Form.Item name="fullName" label="Họ và Tên" rules={[{ required: true, message: 'Vui lòng nhập họ tên!' }]}>
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
                    <Form.Item name="isActive" label="Trạng thái" valuePropName="checked">
                        <Checkbox>Kích hoạt tài khoản</Checkbox>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default UserPermissionScreen;
