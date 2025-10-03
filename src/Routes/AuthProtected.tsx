import React, { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { setAuthorization } from "../helpers/api_helper";
import { useDispatch } from "react-redux";

import { useProfile } from "../Components/Hooks/UserHooks";

import { logoutUser } from "../slices/auth/login/thunk";
import {useAuth} from "react-oidc-context";

const AuthProtected = (props : any) =>{
    const auth = useAuth();
  const dispatch : any = useDispatch();
  const { userProfile, loading, token } = useProfile();
  
  useEffect(() => {
    if (userProfile && !loading && token) { // auth.Profile
      setAuthorization(token);
    } else if (!userProfile && loading && !token) {
      dispatch(logoutUser());
    }
  }, [token, userProfile, loading, dispatch]);

  /*
    Navigate is un-auth access protected routes via url
    */

  if (!userProfile && loading && !token) {
      return auth.signinRedirect()
  }

  return <>{props.children}</>;
};


export default AuthProtected;