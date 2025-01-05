FROM gcc:latest

# Set the working directory
WORKDIR /app

# Copy the current directory contents into the container at /app
COPY src ./src

# Build the C++ application
RUN g++ -o ViewTXO ./src/main.cpp

# Run the C++ application
CMD ["./ViewTXO"]