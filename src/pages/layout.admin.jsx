import {
    AntDesignOutlined,
    ApiOutlined,
    AppstoreOutlined,
    CheckSquareOutlined,
    EditOutlined,
    LoginOutlined,
    LogoutOutlined,
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    SettingOutlined,
} from "@ant-design/icons";
import { Avatar, Button, Dropdown, Layout, Menu, notification, Space } from "antd";
import React, { useContext, useState } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { AuthContext } from "../components/context/auth.context";
const { Sider, Content } = Layout;

// Thêm thuộc tính module (in hoa) vào mỗi menu item
const menuItems = [
    {
        label: <Link to="">Dashboard</Link>,
        key: "",
        icon: <AppstoreOutlined />,
        module: "DASHBOARD",
    },
    {
        label: <Link to="/products">Sản phẩm</Link>,
        key: "/products",
        icon: <AntDesignOutlined />,
        module: "Sản phẩm",
    },
    {
        label: <Link to="/stock-in">Nhập kho</Link>,
        key: "/stock-in",
        icon: <LoginOutlined />,
        module: "Nhập kho",
    },
    {
        label: <Link to="/stock-out">Xuất kho</Link>,
        key: "/stock-out",
        icon: <LogoutOutlined />,
        module: "Xuất kho",
    },
    {
        label: <Link to="/stock-check">Kiểm kê kho</Link>,
        key: "/stock-check",
        icon: <CheckSquareOutlined />,
        module: "Kiểm kê",
    },
    {
        label: <Link to="/reports">Báo cáo</Link>,
        key: "/reports",
        icon: <EditOutlined />,
        module: "Báo cáo",
    },
    {
        label: <Link to="/permissions">Phân quyền</Link>,
        key: "/permissions",
        icon: <ApiOutlined />,
        module: "Người dùng",
    },
    {
        label: <Link to="/settings">Cài đặt</Link>,
        key: "/settings",
        icon: <SettingOutlined />,
        module: "Cài đặt",
    },
];

const LayoutAdmin = () => {
    const [collapsed, setCollapsed] = useState(false);
    const { user, setUser } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleLogout = async () => {
        localStorage.removeItem("access_token");
        setUser({});
        notification.success({
            message: "Đăng xuất thành công",
        });
        navigate("/login");
    };

    const itemsDropdown = [
        ...(user && user.id
            ? [
                  {
                      label: (
                          <label
                              style={{ cursor: "pointer" }}
                              onClick={handleLogout}
                          >
                              Đăng xuất
                          </label>
                      ),
                      key: "logout",
                      icon: <LogoutOutlined />,
                  },
              ]
            : []),
        ...(!user.id
            ? [
                  {
                      label: (
                          <Link style={{ cursor: "pointer" }} to="/login">
                              Đăng nhập
                          </Link>
                      ),
                      key: "login",
                      icon: <LoginOutlined />,
                  },
              ]
            : []),
    ];

    // Lọc menuItems, luôn bao gồm mục Dashboard
    const filteredMenuItems = menuItems.filter((item) =>
        item.module === "DASHBOARD" || // Luôn giữ mục Dashboard
        user?.permissions?.some(
            (perm) => perm.module === item.module
        )
    );

    return (
        <Layout style={{ minHeight: "100vh" }}>
            <Sider theme="light" collapsed={collapsed}>
                <div className="demo-logo-vertical" />
                <div style={{ textAlign: "center" }}>
                    <img src="/img/warehouse_logo.png" alt="Logo" style={{ width: "100%" }} />
                </div>
                <Menu mode="inline" items={filteredMenuItems} />
            </Sider>

            <Layout>
                <div style={{ display: "flex", justifyContent: "space-between", marginRight: 20 }}>
                    <Button
                        type="text"
                        icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                        onClick={() => setCollapsed(!collapsed)}
                        style={{
                            fontSize: "16px",
                            width: 64,
                            height: 64,
                        }}
                    />
                    <Dropdown menu={{ items: itemsDropdown }} trigger={["click"]}>
                        <Space style={{ cursor: "pointer" }}>
                            <span>Welcome {user?.fullName}</span>
                            <Avatar>{user?.fullName?.substring(0, 2)?.toUpperCase()}</Avatar>
                        </Space>
                    </Dropdown>
                </div>

                <Content style={{ padding: "10px 50px" }}>
                    <Outlet />
                </Content>
            </Layout>
        </Layout>
    );
};

export default LayoutAdmin;