using System;

namespace CineTicket.API.Models
{
    /// <summary>
    /// Interface xác định các thuộc tính theo dõi thời gian tạo và cập nhật
    /// </summary>
    public interface IAuditableEntity
    {
        DateTime CreatedAt { get; set; }
        DateTime? UpdatedAt { get; set; }
        int? CreatedById { get; set; }
        int? UpdatedById { get; set; }
    }
}