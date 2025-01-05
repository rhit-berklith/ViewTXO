package viewtxo;

import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

import java.io.IOException;

public class Main {
    public static void main(String[] args) {
        System.out.println("ViewTXO init");

        String trx = "4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b";

        String url = "https://blockstream.info/api/tx/" + trx;
        OkHttpClient client = new OkHttpClient();

        Request request = new Request.Builder()
                .url(url)
                .build();

        try (Response response = client.newCall(request).execute()) {
            if (!response.isSuccessful()) throw new IOException("Unexpected code " + response);

            String responseData = response.body().string();
            JsonObject json = JsonParser.parseString(responseData).getAsJsonObject();
            System.out.println(json.toString());
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}
