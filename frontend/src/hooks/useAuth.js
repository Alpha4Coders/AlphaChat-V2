import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import axios from '../config/axios';
import { ENDPOINTS } from '../config/api';
import { setUser, setLoading } from '../redux/userSlice';

const useAuth = () => {
    const dispatch = useDispatch();
    const { isLoading } = useSelector(state => state.user);
    const hasChecked = useRef(false);

    useEffect(() => {
        // Only run once
        if (hasChecked.current) return;
        hasChecked.current = true;

        const checkAuth = async () => {
            dispatch(setLoading(true));
            try {
                const response = await axios.get(ENDPOINTS.AUTH.ME);
                if (response.data.success) {
                    dispatch(setUser(response.data.user));
                } else {
                    dispatch(setUser(null));
                }
            } catch (error) {
                // 401 is expected when not logged in - just set user to null
                dispatch(setUser(null));
            }
        };

        checkAuth();
    }, [dispatch]);
};

export default useAuth;

