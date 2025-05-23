import {
    AppstoreOutlined, CheckSquareOutlined, EditOutlined,
    LoginOutlined, LogoutOutlined, MenuFoldOutlined, MenuUnfoldOutlined, SettingOutlined
} from "@ant-design/icons";
import { Avatar, Button, Dropdown, Layout, Menu, notification, Space } from "antd"
import React, { useContext, useState } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { AuthContext } from "../components/context/auth.context";
const { Sider, Content } = Layout

const menuItems = [
    {
        label: <Link to=''>Dashboard</Link>,
        key: '',
        icon: <AppstoreOutlined />
    },
    {
        label: <Link to='/stock-in'>Nhập kho</Link>,
        key: '/stock-in',
        icon: <LoginOutlined />
    },
    {
        label: <Link to='/stock-out'>Xuất kho</Link>,
        key: '/stock-out',
        icon: <LogoutOutlined />
    },
    {
        label: <Link to='/stock-check'>Kiểm kê kho</Link>,
        key: '/stock-check',
        icon: <CheckSquareOutlined />
    },
    {
        label: <Link to='/reports'>Báo cáo</Link>,
        key: '/reports',
        icon: <EditOutlined />
    },
    {
        label: <Link to='/settings'>Cài đặt</Link>,
        key: '/settings',
        icon: <SettingOutlined />
    },
]

const LayoutAdmin = () => {
    const [collapsed, setCollapsed] = useState(false)
    const { user, setUser } = useContext(AuthContext)
    const navigate = useNavigate()

    const handleLogout = async () => {
        localStorage.removeItem('access_token')
        setUser({})
        notification.success({
            message: "Đăng xuất thành công"
        })
        navigate('/login')
    }

    const itemsDropdown = [
        ...(user && user.id ? [{
            label: <label
                style={{ cursor: 'pointer' }}
                onClick={handleLogout}
            >Đăng xuất</label>,
            key: 'logout',
            icon: <LogoutOutlined />
        }] : []),
        ...(!user.id ? [{
            label: <Link
                style={{ cursor: 'pointer' }}
                to="/login"
            >Đăng nhập</Link>,
            key: 'login', // Unique key
            icon: <LoginOutlined />
        }] : []),
    ];

    return (
        <>
            <Layout
                style={{ minHeight: '100vh' }}
            >
                <Sider theme="light" collapsed={collapsed}>
                    <div className="demo-logo-vertical" />
                    <div style={{ textAlign: 'center' }}>
                        <img src="/img/logo.jpg" alt="Logo" style={{ width: "100%" }} />
                    </div>
                    <Menu
                        mode="inline"
                        items={menuItems}
                    />
                </Sider>

                <Layout>
                    <div style={{ display: "flex", justifyContent: "space-between", marginRight: 20 }}>
                        <Button
                            type="text"
                            icon={collapsed ? React.createElement(MenuUnfoldOutlined) : React.createElement(MenuFoldOutlined)}
                            onClick={() => setCollapsed(!collapsed)}
                            style={{
                                fontSize: '16px',
                                width: 64,
                                height: 64,
                            }}
                        />

                        <Dropdown menu={{ items: itemsDropdown }} trigger={['click']}>
                            <Space style={{ cursor: "pointer" }}>
                                <span>Welcome {user?.fullName}</span>
                                <Avatar> {user?.fullName?.substring(0, 2)?.toUpperCase()} </Avatar>
                            </Space>
                        </Dropdown>
                    </div>

                    <Content style={{ padding: '10px 50px' }}>
                        <Outlet />
                    </Content>
                </Layout>
            </Layout>
        </>
    )
}

export default LayoutAdmin