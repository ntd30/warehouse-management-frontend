import { createContext, useState } from "react"

export const AuthContext = createContext({
    id: "",
    username: "",
    email: "",
    fullName: "",
    phoneNumber: "",
    address: "",
    roleName: "",
    active: ""
})

export const AuthWrapper = (props) => {
    const [user, setUser] = useState({
        id: "",
        username: "",
        email: "",
        fullName: "",
        phoneNumber: "",
        address: "",
        roleName: "",
        active: ""
    })

    const [isAppLoading, setIsAppLoading] = useState(true)

    return (
        <AuthContext.Provider value={{ user, setUser, isAppLoading, setIsAppLoading }}>
            {props.children}
        </AuthContext.Provider>
    )
}