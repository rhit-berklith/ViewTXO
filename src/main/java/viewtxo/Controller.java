package viewtxo;

import com.google.gson.JsonObject;
import javafx.scene.control.Label;

public class Controller {
    private APIService apiService;

    public Controller(APIService apiService) {
        this.apiService = apiService;
    }

    public void handleGetTransaction(String txid, Label resultLabel) {
        try {
            JsonObject json = apiService.getTransactionData(txid);
            resultLabel.setText(json.toString());
        } catch (Exception e) {
            resultLabel.setText("Error: " + e.getMessage());
        }
    }
}