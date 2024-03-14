import {useLocation, Navigate, Outlet} from "react-router-dom"
import {useSelector} from "react-redux"
import {selectCurrentTokne} from "../../app/store/auth"

const RequireAuth = () => {
    const token = useSelector(selectCurrentTokne)
    const location = useLocation()
    return (
        token
            ? <Outlet />
            : <Navigate to="/login" state={{from: location}} replace/>
    )
}

export default RequireAuth