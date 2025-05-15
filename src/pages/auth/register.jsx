import { Button, Input, Form, notification, Row, Col, Divider, Card, Typography } from "antd"
import { Link, useNavigate } from "react-router-dom";
import { useContext } from "react";
import { IdcardOutlined, LockOutlined, MailOutlined, UserOutlined } from "@ant-design/icons";
import { registerAPI } from "../../services/api.service";
import { AuthContext } from "../../components/context/auth.context";

const { Title } = Typography

const RegisterPage = () => {
    const [form] = Form.useForm()
    const navigate = useNavigate()
    const { setUser } = useContext(AuthContext)

    const onFinish = async (values) => {
        const res = await registerAPI(values.username, values.email, values.password, values.fullName)

        if (res.data) {
            localStorage.setItem('access_token', res.data.access_token)
            setUser(res.data.user)
            notification.success({
                message: "Đăng ký người dùng",
                description: "Đăng ký người dùng thành công"
            })
            navigate("/")
        } else {
            notification.error({
                message: "Lỗi đăng ký người dùng",
                description: JSON.stringify(res)
            })
        }
    }

    return (
        <Row justify={"center"} style={{ marginTop: "30px" }}>
            <Col xs={24} md={16} lg={6}>
                <Card style={{ borderRadius: "8px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
                    <Title level={2} style={{ textAlign: 'center', marginBottom: '30px' }}>
                        Đăng ký
                    </Title>
                    <Form
                        onFinish={onFinish}
                        layout="vertical"
                        form={form}
                    >
                        {/* <h3 style={{ textAlign: "center" }}>Đăng ký tài khoản</h3> */}

                        {/* Tên đăng nhập */}
                        <Form.Item
                            label="Tên đăng nhập"
                            name="username"
                            rules={[{ required: true, message: 'Tên đăng nhập không được bỏ trống!' }]}
                        >
                            <Input prefix={<UserOutlined />} placeholder="Username" size="large" />
                        </Form.Item>

                        <Form.Item
                            label="Email"
                            name="email"
                            rules={[{ required: true, message: 'email không được để trống!' }]}
                        >
                            <Input prefix={<MailOutlined />} placeholder="Email" size="large" />
                        </Form.Item>

                        {/* Mật khẩu */}
                        <Form.Item
                            label="Mật khẩu"
                            name="password"
                            rules={[
                                { required: true, message: 'Mật khẩu không được bỏ trống!' },
                                { min: 6, message: 'Mật khẩu phải có tối thiểu 6 ký tự' }
                            ]}
                        >
                            <Input.Password prefix={<LockOutlined />} placeholder="Password" size="large" />
                        </Form.Item>

                        <Form.Item
                            label="Họ và tên"
                            name="fullName"
                            rules={[{ required: true, message: 'Họ và tên không được để trống!' }]}
                        >
                            <Input prefix={<IdcardOutlined />} placeholder="Full name" />
                        </Form.Item>

                        {/* Nút Đăng ký */}
                        <Form.Item>
                            <Button type="primary" htmlType="submit" size="large">
                                Đăng ký
                            </Button>
                        </Form.Item>

                    </Form >
                </Card>
                <Divider />
                <p style={{ textAlign: "center" }}>Đã có tài khoản? <Link to={"/login"}>Đăng nhập tại đây</Link></p>
            </Col>
        </Row>
    )
}

export default RegisterPage