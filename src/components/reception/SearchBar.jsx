import React from "react";
import { useReception } from "./receptionContext";
import { TextField, InputAdornment } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";

export default function SearchBar() {
  const { search, setSearch } = useReception();

  return (
    <TextField
      fullWidth
      size="small"
      placeholder="Search by name, phone, ID, or host..."
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      variant="outlined"
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon color="action" />
          </InputAdornment>
        ),
      }}
      sx={{
        mb: 2,
        "& .MuiOutlinedInput-root": {
          backgroundColor: "#f9fafb",
        },
      }}
    />
  );
}