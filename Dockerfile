FROM openjdk:11-jdk-slim

WORKDIR /app

COPY gradlew gradlew
COPY gradle gradle
COPY build.gradle build.gradle
COPY settings.gradle settings.gradle

RUN chmod +x gradlew

RUN ./gradlew build --no-daemon || return 0

COPY . .

RUN ./gradlew build --no-daemon

CMD ["java", "-jar", "build/libs/ViewTXO.jar"]