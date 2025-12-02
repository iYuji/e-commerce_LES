import React, { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  Card,
  CardContent,
  Grid,
  Divider,
} from "@mui/material";
import { Download, Upload, DeleteForever, Info } from "@mui/icons-material";
import {
  exportAllData,
  importAllData,
  clearAllData,
} from "../../utils/dataSync";

const AdminDados: React.FC = () => {
  const [importFile, setImportFile] = useState<File | null>(null);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleExport = () => {
    try {
      exportAllData();
      setMessage({ type: "success", text: "Dados exportados com sucesso!" });
    } catch (error) {
      setMessage({ type: "error", text: "Erro ao exportar dados" });
    }
  };

  const handleImport = async () => {
    if (!importFile) {
      setMessage({ type: "error", text: "Selecione um arquivo primeiro" });
      return;
    }

    try {
      await importAllData(importFile);
      setMessage({
        type: "success",
        text: "Dados importados com sucesso! Recarregando...",
      });
    } catch (error) {
      setMessage({
        type: "error",
        text: "Erro ao importar dados. Verifique o arquivo.",
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImportFile(e.target.files[0]);
      setMessage(null);
    }
  };

  const getStorageStats = () => {
    let totalSize = 0;
    const stats: { key: string; size: number }[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key) || "";
        const size = new Blob([value]).size;
        totalSize += size;
        stats.push({ key, size });
      }
    }

    return { totalSize, stats: stats.sort((a, b) => b.size - a.size) };
  };

  const { totalSize, stats } = getStorageStats();

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Gerenciamento de Dados
      </Typography>

      {message && (
        <Alert
          severity={message.type}
          sx={{ mb: 3 }}
          onClose={() => setMessage(null)}
        >
          {message.text}
        </Alert>
      )}

      <Alert severity="info" icon={<Info />} sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>Como funciona:</strong>
          <br />• <strong>Exportar:</strong> Baixa um arquivo JSON com todos os
          dados (pedidos, clientes, cartas, etc.)
          <br />• <strong>Importar:</strong> Carrega dados de um arquivo JSON
          exportado anteriormente
          <br />• <strong>Limpar:</strong> Remove TODOS os dados do sistema (use
          com cuidado!)
        </Typography>
      </Alert>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Download sx={{ fontSize: 40, color: "primary.main", mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Exportar Dados
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Baixe um backup completo de todos os dados do sistema
              </Typography>
              <Button
                variant="contained"
                fullWidth
                startIcon={<Download />}
                onClick={handleExport}
              >
                Exportar JSON
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Upload sx={{ fontSize: 40, color: "success.main", mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Importar Dados
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Restaure dados de um backup anterior
              </Typography>
              <input
                type="file"
                accept=".json"
                onChange={handleFileChange}
                style={{ display: "none" }}
                id="import-file"
              />
              <label htmlFor="import-file">
                <Button
                  variant="outlined"
                  fullWidth
                  component="span"
                  sx={{ mb: 1 }}
                >
                  Selecionar Arquivo
                </Button>
              </label>
              {importFile && (
                <Typography variant="caption" display="block" sx={{ mb: 1 }}>
                  {importFile.name}
                </Typography>
              )}
              <Button
                variant="contained"
                color="success"
                fullWidth
                startIcon={<Upload />}
                onClick={handleImport}
                disabled={!importFile}
              >
                Importar JSON
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <DeleteForever
                sx={{ fontSize: 40, color: "error.main", mb: 2 }}
              />
              <Typography variant="h6" gutterBottom>
                Limpar Dados
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Remove todos os dados do sistema (não reversível)
              </Typography>
              <Button
                variant="contained"
                color="error"
                fullWidth
                startIcon={<DeleteForever />}
                onClick={clearAllData}
              >
                Limpar Tudo
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Estatísticas de Armazenamento
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Total usado: {(totalSize / 1024).toFixed(2)} KB
        </Typography>
        <Divider sx={{ my: 2 }} />
        <Grid container spacing={2}>
          {stats.map((stat) => (
            <Grid item xs={12} sm={6} md={4} key={stat.key}>
              <Box
                sx={{
                  p: 2,
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 1,
                }}
              >
                <Typography variant="body2" fontWeight="bold">
                  {stat.key}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {(stat.size / 1024).toFixed(2)} KB
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Paper>
    </Box>
  );
};

export default AdminDados;
