export function catch_with_callback(callback: (err: unknown) => void) {
  return (
    _target: unknown,
    _property_key: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    descriptor: TypedPropertyDescriptor<(...args: any[]) => Promise<any>>
  ): void => {
    const original_method = descriptor.value;

    descriptor.value = async function (...args: unknown[]) {
      try {
        return await original_method!.apply(this, args);
      } catch (err) {
        callback(err);
      }
    };
  };
}