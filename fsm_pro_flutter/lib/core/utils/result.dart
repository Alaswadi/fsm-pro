/// Result class for error handling pattern
/// Wraps success or error responses from operations
class Result<T> {
  final T? data;
  final String? error;
  final bool isSuccess;

  Result.success(this.data) : isSuccess = true, error = null;

  Result.error(this.error) : isSuccess = false, data = null;

  /// Returns true if the result is an error
  bool get isError => !isSuccess;

  /// Executes a function if the result is successful
  Result<R> map<R>(R Function(T data) transform) {
    if (isSuccess && data != null) {
      try {
        return Result.success(transform(data as T));
      } catch (e) {
        return Result.error(e.toString());
      }
    }
    return Result.error(error ?? 'Unknown error');
  }

  /// Executes a function if the result is an error
  Result<T> onError(void Function(String error) callback) {
    if (isError && error != null) {
      callback(error!);
    }
    return this;
  }

  /// Executes a function if the result is successful
  Result<T> onSuccess(void Function(T data) callback) {
    if (isSuccess && data != null) {
      callback(data as T);
    }
    return this;
  }

  /// Returns the data or throws an exception if error
  T getOrThrow() {
    if (isSuccess && data != null) {
      return data as T;
    }
    throw Exception(error ?? 'Unknown error');
  }

  /// Returns the data or a default value if error
  T getOrDefault(T defaultValue) {
    if (isSuccess && data != null) {
      return data as T;
    }
    return defaultValue;
  }
}
