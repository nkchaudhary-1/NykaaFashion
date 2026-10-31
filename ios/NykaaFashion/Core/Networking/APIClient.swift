import Foundation
#if canImport(FoundationNetworking)
import FoundationNetworking
#endif

enum HTTPMethod: String {
    case get = "GET"
    case post = "POST"
    case put = "PUT"
    case patch = "PATCH"
    case delete = "DELETE"
}

enum APIError: Error {
    case invalidURL
    case invalidResponse
    case status(Int)
    case transport(any Error)
    case decoding(any Error)
}

/// A request description that is independent of the base URL, so the same
/// endpoints work against staging, production, or a mock server.
struct Endpoint {
    var path: String
    var method: HTTPMethod = .get
    var query: [URLQueryItem] = []
    var headers: [String: String] = [:]
    var body: Data? = nil

    func urlRequest(baseURL: URL) throws -> URLRequest {
        guard var components = URLComponents(
            url: baseURL.appendingPathComponent(path),
            resolvingAgainstBaseURL: false
        ) else { throw APIError.invalidURL }
        if !query.isEmpty { components.queryItems = query }
        guard let url = components.url else { throw APIError.invalidURL }

        var request = URLRequest(url: url)
        request.httpMethod = method.rawValue
        for (field, value) in headers { request.setValue(value, forHTTPHeaderField: field) }
        request.httpBody = body
        return request
    }
}

/// Features depend on this protocol, not on URLSession, so previews and tests
/// can inject a fake.
protocol APIClient {
    func send<Response: Decodable>(_ endpoint: Endpoint) async throws -> Response
}

struct URLSessionAPIClient: APIClient {
    let baseURL: URL
    var session: URLSession = .shared
    var decoder = JSONDecoder()

    func send<Response: Decodable>(_ endpoint: Endpoint) async throws -> Response {
        let request = try endpoint.urlRequest(baseURL: baseURL)
        let (data, http) = try await fetch(request)
        guard (200..<300).contains(http.statusCode) else { throw APIError.status(http.statusCode) }
        do {
            return try decoder.decode(Response.self, from: data)
        } catch {
            throw APIError.decoding(error)
        }
    }

    private func fetch(_ request: URLRequest) async throws -> (Data, HTTPURLResponse) {
        do {
            let (data, response) = try await session.data(for: request)
            guard let http = response as? HTTPURLResponse else { throw APIError.invalidResponse }
            return (data, http)
        } catch let error as APIError {
            throw error
        } catch {
            throw APIError.transport(error)
        }
    }
}
