using System;
using System.Runtime.InteropServices;
using System.Text;

namespace ExportedConfigs.MMPConvTool.Core
{
	public delegate T DeserializeMethod<T>(ref DeserializeParas paras);

	public delegate void SerializeMethod<T>(ref SerializeParas paras, T value);

	public delegate void FromValue<T>(IntPtr ptr, T value);

	public delegate T ToValue<T>(IntPtr ptr);

	public struct DeserializeParas
	{
		public byte[] Bytes;
		private IntPtr _ptr;
		public IntPtr Ptr => _ptr + Offset;
		public int Offset;

		public DeserializeParas(byte[] bytes)
		{
			IntPtr ptr = Marshal.UnsafeAddrOfPinnedArrayElement(bytes, 0);

			Bytes = bytes;
			_ptr = ptr;
			Offset = 0;
		}
	}

	public struct SerializeParas
	{
		public byte[] Bytes;
		private IntPtr _ptr;
		public IntPtr Ptr => _ptr + Offset;
		public int Offset;

		public SerializeParas(byte[] bytes)
		{
			IntPtr ptr = Marshal.UnsafeAddrOfPinnedArrayElement(bytes, 0);

			Bytes = bytes;
			_ptr = ptr;
			Offset = 0;
		}
	}

	public static class BitUtils
	{
		public static T[] ToArray<T>(ref DeserializeParas paras, DeserializeMethod<T> func)
		{
			var count = BitUtils.ToValue(ref paras, Marshal.ReadInt32);

			var arr = new T[count];
			for (var i = 0; i < count; i++)
			{
				arr[i] = func(ref paras);
			}

			return arr;
		}

		public static void ToArrayInternal<T>(ref DeserializeParas paras, ref T[] arr) where T : IMMPSerializable, new()
		{
			var count = BitUtils.ToValue(ref paras, Marshal.ReadInt32);

			arr = new T[count];
			for (var i = 0; i < count; i++)
			{
				var obj = new T();
				obj.Deserialize(ref paras);
				arr[i] = obj;
			}
		}

		public static void FromArrayInternal<T>(ref SerializeParas paras, T[] arr) where T : IMMPSerializable
		{
			BitUtils.FromValue(ref paras, Marshal.WriteInt32, arr.Length);
			foreach (var obj in arr)
			{
				obj.Serialize(ref paras);
			}
		}

		public static void FromArray<T>(ref SerializeParas paras, T[] arr, SerializeMethod<T> func)
		{
			BitUtils.FromValue(ref paras, Marshal.WriteInt32, arr.Length);
			foreach (var obj in arr)
			{
				func(ref paras, obj);
			}
		}

		public static T[] ToRawArray<T>(ref DeserializeParas paras) where T : unmanaged
		{
			var len = BitUtils.ToValue(ref paras, Marshal.ReadInt32);

			var arr = new T[len];
			var ptr = Marshal.UnsafeAddrOfPinnedArrayElement(arr, 0);
			unsafe
			{
				var size = sizeof(T);
				var byteLen = len * size;
				Marshal.Copy(paras.Bytes, paras.Offset, ptr, byteLen);
				paras.Offset += byteLen;
			}

			return arr;
		}

		public static void FromRawArray<T>(ref SerializeParas paras, T[] arr) where T : unmanaged
		{
			var arrLength = arr.Length;
			BitUtils.FromValue(ref paras, Marshal.WriteInt32, arrLength);
			var ptr = Marshal.UnsafeAddrOfPinnedArrayElement(arr, 0);
			unsafe
			{
				var size = sizeof(T);
				var byteLength = arrLength * size;
				Marshal.Copy(ptr, paras.Bytes, paras.Offset, byteLength);
				paras.Offset += byteLength;
			}
		}

		public static string ToString(ref DeserializeParas paras)
		{
			var len = BitUtils.ToValue(ref paras, Marshal.ReadInt32);
			unsafe
			{
				var str = Marshal.PtrToStringUTF8(paras.Ptr, len);
				paras.Offset += len;
				return str;
			}
		}

		public static void FromString(ref SerializeParas paras, string str)
		{
			var writeLen = Encoding.UTF8.GetBytes(str, 0, str.Length, paras.Bytes, paras.Offset + 4);
			BitUtils.FromValue(ref paras, Marshal.WriteInt32, writeLen);

			paras.Offset += writeLen;
		}

		public static T ToValue<T>(ref DeserializeParas paras, ToValue<T> conv) where T : unmanaged
		{
			var value = conv(paras.Ptr);
			unsafe
			{
				paras.Offset += sizeof(T);
			}

			return value;
		}

		public static void FromValue<T>(ref SerializeParas paras, FromValue<T> conv, T value) where T : unmanaged
		{
			conv(paras.Ptr, value);
			unsafe
			{
				paras.Offset += sizeof(T);
			}
		}
	}

	public interface IMMPSerializable
	{
		public void Serialize(ref SerializeParas paras);
		public void Deserialize(ref DeserializeParas paras);
	}
}