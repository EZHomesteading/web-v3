//update listing parent lement
import { getListingByIdUpdate } from "@/actions/getListings";
import ClientOnly from "@/components/client/client-only";
import UpdateClient from "./update.client";
//import { SafeListing } from "@/types";

interface IParams {
  listingId?: string;
}

const UpdatePage = async ({ params }: { params: IParams }) => {
  const listing = await getListingByIdUpdate(params);

  return (
    <ClientOnly>
      {listing ? <UpdateClient listing={listing} /> : <></>}
    </ClientOnly>
  );
};

export default UpdatePage;
