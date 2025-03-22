import './style.css';

type ConfirmButtonProps = {
    onClick: () => void; // Určuje, že prop `onClick` je funkce
};

function ConfirmButton({ onClick }: ConfirmButtonProps) { // Přijímáme prop `onClick`
    return ( 
        <button onClick={onClick}>Confirm</button> 
    );
}

export default ConfirmButton;
