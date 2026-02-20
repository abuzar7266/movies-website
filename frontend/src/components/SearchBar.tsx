import { Search, X } from "lucide-react";
import styles from "./SearchBar.module.css";

interface SearchBarProps {
  value: string;
  onSearch: (query: string) => void;
  placeholder?: string;
}

const SearchBar = ({ value, onSearch, placeholder = "Search movies by title..." }: SearchBarProps) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearch(e.target.value);
  };

  const handleClear = () => {
    onSearch("");
  };

  return (
    <div className={styles.root}>
      <Search size={18} className={styles.icon} />
      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className={styles.input}
      />
      {value && (
        <button onClick={handleClear} className={styles.clearButton}>
          <X size={16} />
        </button>
      )}
    </div>
  );
};

export default SearchBar;
