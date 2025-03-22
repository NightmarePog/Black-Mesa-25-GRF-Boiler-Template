import "./style.css";

import InputComponent from "../InputComponent/inputComponent";
import ConfirmButton from "../ConfirmButton/ConfirmButton";

function MainPage() {
    const CreateRoomButton = () => {
        console.log("Create Room button clicked");
        // Add room creation logic here
    };

    const JoinRoomButton = () => {
        console.log("Join Room button clicked");
        // Add join room logic here
    };

    return (
        <>
            <InputComponent />
            <ConfirmButton onClick={CreateRoomButton} />
            <InputComponent />
            <ConfirmButton onClick={JoinRoomButton} />
        </>
    );
}

export default MainPage;
