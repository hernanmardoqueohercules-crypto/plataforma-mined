import React, { useEffect, useRef } from 'react';

// Define la forma del perfil de usuario decodificado desde el JWT de Google
interface GoogleUserProfile {
    name: string;
    email: string;
    picture: string;
    given_name: string;
    family_name: string;
    email_verified: boolean;
    sub: string;
}

interface GoogleSignInButtonProps {
    onLoginSuccess: (user: { name: string; email: string; picture: string; }) => void;
    onLoginFailure?: () => void;
}

// Decodificador simple para el JWT de Google
const decodeJwt = (token: string): GoogleUserProfile => {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        return JSON.parse(jsonPayload);
    } catch (e) {
        console.error("Error decoding JWT", e);
        return {} as GoogleUserProfile;
    }
}

const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({ onLoginSuccess, onLoginFailure }) => {
    const buttonDivRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (typeof window.google === 'undefined' || !buttonDivRef.current) {
            console.warn("Google script not loaded yet.");
            return;
        }

        const handleCredentialResponse = (response: any) => {
            if (response.credential) {
                const userProfile = decodeJwt(response.credential);
                if (userProfile.email) {
                    onLoginSuccess({
                        name: userProfile.name,
                        email: userProfile.email,
                        picture: userProfile.picture,
                    });
                } else {
                     console.error("Google login failed: Could not decode user profile from credential");
                    if (onLoginFailure) onLoginFailure();
                }
            } else {
                console.error("Google login failed: No credential in response");
                if (onLoginFailure) onLoginFailure();
            }
        };

        try {
            window.google.accounts.id.initialize({
                client_id: process.env.GOOGLE_CLIENT_ID!,
                callback: handleCredentialResponse,
            });

            window.google.accounts.id.renderButton(
                buttonDivRef.current,
                { 
                    theme: 'filled_blue', 
                    size: 'large', 
                    type: 'standard', 
                    text: 'continue_with',
                    shape: 'rectangular',
                    logo_alignment: 'left',
                    width: '300'
                }
            );

        } catch (error) {
            console.error("Error initializing Google Sign-In", error);
        }

    }, [onLoginSuccess, onLoginFailure]);

    return <div ref={buttonDivRef} className="flex justify-center"></div>;
};

export default GoogleSignInButton;
