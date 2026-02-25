import { useState } from "react";
import Countdown from "./components/Countdown/Countdown";
import GiftCard from "./components/GiftCard/GiftCard";
import PixModel from "./components/PixModel/PixModel";

function App() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState(null);

  const handleSelectGift = (value) => {
    setSelectedValue(value);
    setIsOpen(true);
  };

  const values = [50,100,150,200,300,400,500,600,700,800,900,1000];

  return (
    <>
      <Countdown />

      <section className="giftSection">
        {values.map((value) => (
          <GiftCard
            key={value}
            value={value}
            onSelect={handleSelectGift}
          />
        ))}
      </section>

      <PixModel
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        selectedValue={selectedValue}
      />
    </>
  );
}

export default App;