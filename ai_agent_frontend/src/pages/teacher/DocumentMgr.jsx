import { useState, useEffect } from "react";
import documentApi from "../../api/documentApi"; // Import đường ống API thật

export default function DocumentMgr() {
  const [activeTab, setActiveTab] = useState("upload"); 
  
  // State cho Form Upload
  const [courseName, setCourseName] = useState("");
  const [lessonName, setLessonName] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  // State cho Danh sách tài liệu thật từ Database
  const [documents, setDocuments] = useState([]);
  const [isFetching, setIsFetching] = useState(false);

  // Tự động gọi API lấy danh sách khi chuyển sang tab "list"
  useEffect(() => {
    if (activeTab === "list") {
      fetchDocuments();
    }
  }, [activeTab]);

  const fetchDocuments = async () => {
    setIsFetching(true);
    try {
      const data = await documentApi.getDocuments();
      setDocuments(data);
    } catch (error) {
      console.error("Lỗi khi lấy danh sách tài liệu:", error);
      alert("Không thể tải danh sách tài liệu từ máy chủ!");
    } finally {
      setIsFetching(false);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file || !courseName || !lessonName) {
      alert("Vui lòng điền đủ Tên môn, Tên bài và chọn file PDF!");
      return;
    }

    setLoading(true);
    try {
      // GỌI API THẬT: Bơm dữ liệu xuống Backend
      await documentApi.uploadDocument(courseName, lessonName, file);
      
      alert("✅ Tải lên tài liệu thành công và đã lưu vào Database!");
      
      // Reset form
      setCourseName("");
      setLessonName("");
      setFile(null);
      
      // Tự động chuyển sang tab danh sách để xem thành quả
      setActiveTab("list");
    } catch (error) {
      console.error("Lỗi upload:", error);
      alert("❌ Có lỗi xảy ra khi tải lên. Vui lòng kiểm tra Backend!");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa tài liệu này không? (Sẽ xóa cả file PDF trong máy chủ)")) {
      try {
        // GỌI API THẬT: Xóa trong DB và xóa file vật lý
        await documentApi.deleteDocument(id);
        
        // Cập nhật lại danh sách trên màn hình ngay lập tức
        setDocuments(documents.filter(doc => doc.id !== id));
      } catch (error) {
        console.error("Lỗi khi xóa:", error);
        alert("❌ Xóa thất bại!");
      }
    }
  };

  // Hàm hỗ trợ format ngày tháng từ PostgreSQL cho đẹp (VD: 2026-03-02T... -> 02/03/2026)
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN") + " " + date.toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* HEADER & TABS */}
      <div className="border-b border-gray-200 bg-gray-50 px-6 pt-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">📄 Quản lý Tài liệu Bài giảng</h2>
        <div className="flex space-x-6">
          <button 
            onClick={() => setActiveTab("upload")}
            className={`pb-4 font-semibold text-sm transition-colors relative ${activeTab === 'upload' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            + Tải lên tài liệu mới
            {activeTab === 'upload' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-t-md"></span>}
          </button>
          <button 
            onClick={() => setActiveTab("list")}
            className={`pb-4 font-semibold text-sm transition-colors relative ${activeTab === 'list' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            📋 Danh sách tài liệu
            {activeTab === 'list' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-t-md"></span>}
          </button>
        </div>
      </div>

      <div className="p-6">
        {/* TAB 1: UPLOAD */}
        {activeTab === "upload" && (
          <form onSubmit={handleUpload} className="max-w-2xl mx-auto animate-fadeIn">
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Tên môn học</label>
                <input 
                  type="text" 
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  placeholder="VD: Lập trình Java Core"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Tên bài học</label>
                <input 
                  type="text" 
                  value={lessonName}
                  onChange={(e) => setLessonName(e.target.value)}
                  placeholder="VD: Chương 1 - Biến và Kiểu dữ liệu"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">File PDF Bài giảng</label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-blue-400 transition bg-gray-50">
                  <div className="space-y-1 text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <div className="flex text-sm text-gray-600 justify-center">
                      <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 px-1">
                        <span>Chọn file PDF</span>
                        <input type="file" className="sr-only" accept=".pdf" onChange={handleFileChange} />
                      </label>
                    </div>
                  </div>
                </div>
                {file && <p className="mt-2 text-sm text-green-600 font-medium">✅ Đã chọn: {file.name}</p>}
              </div>

              <button 
                type="submit"
                disabled={loading}
                className={`w-full py-3 mt-4 rounded-lg font-bold text-white shadow-md transition ${loading ? 'bg-gray-400 cursor-wait' : 'bg-blue-600 hover:bg-blue-700'}`}
              >
                {loading ? "Đang tải lên Server..." : "LƯU TÀI LIỆU VÀO DATABASE"}
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: LIST THẬT TỪ DATABASE */}
        {activeTab === "list" && (
          <div className="animate-fadeIn overflow-x-auto">
            {isFetching ? (
              <div className="text-center py-10 text-gray-500">Đang tải danh sách từ máy chủ...</div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Môn học / Bài học</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tên File</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày tải lên</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {documents.map((doc) => (
                    <tr key={doc.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{doc.course_name}</div>
                        <div className="text-sm text-gray-500">{doc.lesson_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          📄 {doc.file_name}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(doc.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button 
                          onClick={() => handleDelete(doc.id)}
                          className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-md transition"
                        >
                          Xóa DB & File
                        </button>
                      </td>
                    </tr>
                  ))}
                  {documents.length === 0 && (
                    <tr>
                      <td colSpan="4" className="px-6 py-10 text-center text-gray-500">
                        Database đang trống. Hãy sang tab Tải lên để thêm file đầu tiên nhé!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}