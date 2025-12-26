import React, { useState } from "react";
import { Box, Button, MenuItem, TextField, Typography } from "@mui/material";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";

export default function AssignGate() {
  const { user, refreshUser } = useAuth();
  const [gate, setGate] = useState("");

  const submit = async () => {
    await api.post("/security/assign-gate", { gateId: gate });
    await refreshUser(); // reload user + token
  };

  return (
    <Box p={3}>
      <Typography variant="h6">Assign Gate</Typography>

      <TextField
        select
        fullWidth
        label="Gate"
        value={gate}
        onChange={(e) => setGate(e.target.value)}
        sx={{ my: 2 }}
      >
        {["GATE-1", "GATE-2", "GATE-3"].map((g) => (
          <MenuItem key={g} value={g}>
            {g}
          </MenuItem>
        ))}
      </TextField>

      <Button
        variant="contained"
        disabled={!gate}
        onClick={submit}
      >
        Confirm Gate
      </Button>
    </Box>
  );
}

