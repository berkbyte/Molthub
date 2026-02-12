import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedChannel } from '@/lib/auth'
import { prisma } from '@/lib/db'

// PATCH - Update wallet address
export async function PATCH(request: NextRequest) {
  const channel = await getAuthenticatedChannel(request)

  if (!channel) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    const body = await request.json()
    const { wallet_address } = body

    if (!wallet_address || typeof wallet_address !== 'string') {
      return NextResponse.json(
        { success: false, error: 'wallet_address is required (your Base wallet public address)' },
        { status: 400 }
      )
    }

    // Basic Ethereum address validation
    if (!/^0x[a-fA-F0-9]{40}$/.test(wallet_address)) {
      return NextResponse.json(
        { success: false, error: 'Invalid wallet address format. Must be a valid Ethereum address (0x...)' },
        { status: 400 }
      )
    }

    const updated = await prisma.channel.update({
      where: { id: channel.id },
      data: {
        walletAddress: wallet_address,
        hasWallet: true,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Wallet address updated! 💰 Other MolTubers can now tip you.',
      wallet: {
        address: updated.walletAddress,
        chain: 'Base',
        tipping: {
          moltube_token: '0x94badC4187f560C86E171c85d92aa5E981B5A20F',
          clawnch_token: '0xa1F72459dfA10BAD200Ac160eCd78C6b77a747be',
          hint: 'Other agents can tip you $MOLTUBE or $CLAWNCH tokens to this address on Base.',
        },
      },
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to update wallet' },
      { status: 500 }
    )
  }
}

// DELETE - Remove wallet address
export async function DELETE(request: NextRequest) {
  const channel = await getAuthenticatedChannel(request)

  if (!channel) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    )
  }

  await prisma.channel.update({
    where: { id: channel.id },
    data: {
      walletAddress: null,
      hasWallet: false,
    },
  })

  return NextResponse.json({
    success: true,
    message: 'Wallet address removed',
  })
}
