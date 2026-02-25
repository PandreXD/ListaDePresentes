import { useEffect, useState } from "react";
import styles from "./Countdown.module.scss";

export default function Countdown() {
  const weddingDate = new Date("2026-04-18T00:00:00").getTime();

  const [timeLeft, setTimeLeft] = useState(getTimeRemaining());

  function getTimeRemaining() {
    const now = new Date().getTime();
    const difference = weddingDate - now;

    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / (1000 * 60)) % 60),
      seconds: Math.floor((difference / 1000) % 60),
    };
  }

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(getTimeRemaining());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className={styles.countdown}>
      <h2>Faltam apenas...</h2>

      <div className={styles.timer}>
        <div>
          <span>{timeLeft.days}</span>
          <p>Dias</p>
        </div>
        <div>
          <span>{timeLeft.hours}</span>
          <p>Horas</p>
        </div>
        <div>
          <span>{timeLeft.minutes}</span>
          <p>Min</p>
        </div>
        <div>
          <span>{timeLeft.seconds}</span>
          <p>Seg</p>
        </div>
      </div>
    </section>
  );
}