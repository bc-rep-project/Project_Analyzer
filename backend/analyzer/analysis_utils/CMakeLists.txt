cmake_minimum_required(VERSION 3.0)  # Adjust if needed

project(analyze_cpp)

# Assuming nlohmann/json is readily available, but include if necessary:
# find_package(nlohmann_json REQUIRED)

add_executable(analyze_cpp analyze_cpp.cpp)

# If nlohmann/json requires include directories:
# target_include_directories(analyze_cpp PRIVATE ${nlohmann_json_INCLUDE_DIRS}) 
find_package(Clang REQUIRED) 
target_link_libraries(analyze_cpp PRIVATE Clang::LLVM Clang::Tooling) 