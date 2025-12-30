import { Box, Paper, Typography } from "@mui/material";

export default function GateHeatmap({ visitors }) {
  const gateStats = visitors.reduce((acc, v) => {
    const gateName = v.gate?.name;
    if (!gateName) return acc;

    if (!acc[gateName]) acc[gateName] = 0;

    if (
      v.status === "IN" &&
      v.allowedUntil &&
      new Date(v.allowedUntil) < new Date()
    ) {
      acc[gateName]++;
    }
    return acc;
  }, {});

  return (
    <Box display="grid" gridTemplateColumns="repeat(4,1fr)" gap={2}>
      {Object.entries(gateStats).map(([gate, count]) => (
        <Paper
          key={gate}
          sx={{
            p: 3,
            textAlign: "center",
            bgcolor:
              count >= 5 ? "#F44336" :
              count >= 2 ? "#FF9800" :
              "#4CAF50",
            color: "#fff",
          }}
        >
          <Typography variant="h6">{gate}</Typography>
          <Typography>{count} Overstays</Typography>
        </Paper>
      ))}
    </Box>
  );
}