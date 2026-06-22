import React from "react";
import "../App.css"
import x from "../assets/Zoomclone.mp4"
import posterImg from "../assets/poster.png";
import mainload from "../assets/mainloadingpage.png";
import '@fontsource/space-grotesk/400.css';
import '@fontsource/space-grotesk/700.css';
import { Link, useNavigate } from "react-router-dom";

function LandingPage() {

    const router = useNavigate();
    return (
        <div className="LandingPageContainer">
            <video className="BackgroundVideo" autoPlay loop muted playsInline poster={posterImg}>
                <source src={x} type="video/mp4" />
            </video>

            <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%' }}>
                <nav>
                    <div className="navHeader">
                        <h2>
                            Convexe
                        </h2>
                    </div>
                    <div className="navList">
                        <p
                            onClick={() => {
                                const roomId = crypto.randomUUID();
                                router(`/guest/${roomId}`)
                            }}
                        >
                            Join as guest
                        </p>
                        <p>Register</p>
                        <div onClick={() => {
                            router("/auth")
                        }} role="button">
                            <p
                                onClick={() => {
                                    router("/auth")
                                }}
                                role="button"
                            >Login</p>
                        </div>
                    </div>
                </nav>

                <div className="landingMainContainer">
                    <div className="landingTextContainer">
                        <h1>
                            <span>
                                Where distance converges
                            </span>
                        </h1>
                        <p>"Where independent nodes connects into a singular, unbroken network."
                        </p>
                        <div className="startBtn" role="button">
                            <Link to={"/auth"} style={{ textDecoration: 'none' }}><p>Start for free</p></Link>
                        </div>
                    </div>
                    <img className="mainload" src={mainload} alt="" />
                </div>
            </div>
        </div>
    );
}

export default LandingPage;

