package viewtxo;

public class Main {
    public static void main(String[] args) {
        APIService apiService = new APIService();
        Controller controller = new Controller(apiService);
        View view = new View();
        view.setController(controller);
        view.launch(View.class, args);
    }
}