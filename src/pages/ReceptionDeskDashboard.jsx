import React, { useContext } from "react";
import { Box, Paper, Typography, Button } from "@mui/material";

import VisitorRegistrationForm from "../components/VisitorRegistrationForm";
import VisitorList from "../components/reception/VisitorList";
import { ReceptionProvider } from "../components/reception/receptionContext";
import SocketContext from "../context/SocketContext";
import { useAuth } from "../context/AuthContext";

export default function ReceptionDeskDashboard() {
  const socket = useContext(SocketContext);
  const { user, logoutUser } = useAuth();

  return (
    <ReceptionProvider socket={socket}>
      <Box p={3}>
        {/* Header */}
        <Box mb={2} display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h5">Reception Dashboard</Typography>
            <Typography variant="subtitle2">
              Welcome, {user?.name}
            </Typography>
          </Box>

          <Button size="small" variant="outlined" onClick={logoutUser}>
            Logout
          </Button>
        </Box>

        {/* Content */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              md: "1fr 2fr",
            },
            gap: 2,
          }}
        >
          {/* Visitor Registration */}
          <Paper sx={{ p: 2 }}>
            <VisitorRegistrationForm />
          </Paper>

          {/* Visitor List */}
          <Paper sx={{ p: 2 }}>
            <VisitorList />
          </Paper>
        </Box>
      </Box>
    </ReceptionProvider>
  );
}
