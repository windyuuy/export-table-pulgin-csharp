using System;
using System.Runtime.InteropServices;
using ExportedConfigs.MMPConvTool.Core;

#nullable disable
namespace FaBao.ExportedConfigs
{
	[Serializable]
	[StructLayout(LayoutKind.Sequential, Pack = 4, CharSet = CharSet.Ansi)]
	public struct WritableValueTuple<T1, T2> : IMMPSerializable
	{
		public T1 Item1;
		public T2 Item2;

		private static int _typeSize = -1;

		public static int GetTypeSize()
		{
			if (_typeSize >= 0)
			{
				return _typeSize;
			}

			_typeSize = Marshal.SizeOf<WritableValueTuple<T1, T2>>();
			return _typeSize;
		}

		public void Deserialize(ref DeserializeParas paras)
		{
			this = Marshal.PtrToStructure<WritableValueTuple<T1, T2>>(paras.Ptr);
			paras.Offset += GetTypeSize();
		}

		public void Serialize(ref SerializeParas paras)
		{
			Marshal.StructureToPtr(this, paras.Ptr, false);
			paras.Offset += GetTypeSize();
		}
	}
}