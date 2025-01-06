FROM openjdk:11-jdk-slim

# Set environment variables
ENV JAVAFX_SDK_VERSION=17.0.2
ENV JAVAFX_SDK_URL=https://gluonhq.com/download/javafx-17-0-2-sdk-linux/
ENV JAVAFX_SDK_PATH=/opt/javafx-sdk-$JAVAFX_SDK_VERSION

# Install necessary tools
RUN apt-get update && apt-get install -y wget unzip

# Download and unzip JavaFX SDK
RUN wget -O /tmp/javafx-sdk.zip $JAVAFX_SDK_URL && \
    unzip /tmp/javafx-sdk.zip -d /opt && \
    rm /tmp/javafx-sdk.zip

WORKDIR /app

COPY gradlew gradlew
COPY gradle gradle
COPY build.gradle build.gradle
COPY settings.gradle settings.gradle

RUN chmod +x gradlew

COPY . .

# Set the module path for JavaFX
ENV JAVA_TOOL_OPTIONS="-Djava.library.path=$JAVAFX_SDK_PATH/lib --module-path $JAVAFX_SDK_PATH/lib --add-modules javafx.controls,javafx.fxml"

RUN ./gradlew shadowJar --no-daemon

CMD ["java", "-jar", "build/libs/ViewTXO-all.jar"]