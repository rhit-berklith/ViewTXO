package viewtxo;

import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

import java.io.IOException;

public class APIService {
    private OkHttpClient client = new OkHttpClient();

    public JsonObject getTransactionData(String txid) throws IOException {
        String url = "https://blockstream.info/api/tx/" + txid;

        Request request = new Request.Builder()
                .url(url)
                .build();

        try (Response response = client.newCall(request).execute()) {
            if (!response.isSuccessful()) {
                throw new IOException("Unexpected code " + response);
            }

            String responseData = response.body().string();
            return JsonParser.parseString(responseData).getAsJsonObject();
        }
    }
}
