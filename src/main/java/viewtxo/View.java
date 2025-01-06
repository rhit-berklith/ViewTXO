package viewtxo;

import javafx.application.Application;
import javafx.scene.Scene;
import javafx.scene.control.Button;
import javafx.scene.control.Label;
import javafx.scene.control.TextField;
import javafx.scene.layout.VBox;
import javafx.stage.Stage;

public class View extends Application {

    private Controller controller;

    public void setController(Controller controller) {
        this.controller = controller;
    }

    @Override
    public void start(Stage primaryStage) {
        primaryStage.setTitle("Bitcoin UTXO Visualizer");

        Label label = new Label("Enter Transaction ID:");
        TextField textField = new TextField();
        Button button = new Button("Get UTXOs");
        Label resultLabel = new Label();

        button.setOnAction(e -> {
            String txid = textField.getText();
            controller.handleGetTransaction(txid, resultLabel);
        });

        VBox vbox = new VBox(label, textField, button, resultLabel);
        Scene scene = new Scene(vbox, 400, 200);

        primaryStage.setScene(scene);
        primaryStage.show();
    }

    public static void main(String[] args) {
        launch(args);
    }
}
