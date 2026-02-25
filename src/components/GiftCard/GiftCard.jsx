import styles from "./GiftCard.module.scss";

export default function GiftCard({ value, onSelect }) {
  return (
    <section className={styles.card}>
      <h3 className={styles.title}>Vale Presente</h3>

      <div className={styles.valueRow}>
        <span className={styles.icon}>🎁</span>
        <p className={styles.price}>R$ {value}</p>
      </div>

      <button 
        className={styles.button}
        onClick={() => onSelect(value)}
      >
        Presentear
      </button>
    </section>
  );
}